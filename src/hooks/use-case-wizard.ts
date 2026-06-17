"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ClassicPresentation,
  ClinicalAiInsight,
  ClinicalContradiction,
  ClinicalStepResponse,
  CoPilotInsight,
  DiagnosisResult,
  PatientCase,
  SavedCase,
  Sex,
} from "@/lib/types";
import { detectContradictions, aiDetectContradictions } from "@/lib/clinical-memory";
import { formatAiError } from "@/lib/ai";
import { diagnosisToInsight } from "@/lib/clinical-ai";
import { getLocalClinicalInsight } from "@/lib/clinical-fallback";
import { buildStepValue, buildSkippedValue } from "@/lib/step-utils";
import { saveToLibrary } from "@/lib/case-library";

type Mode = "clinical" | "classic";
type Phase = "demographics" | "complaints" | "dynamic" | "results" | "presentation";

interface StepRecord {
  fieldKey: string;
  category: string;
}

const BASE_COMPLAINTS = [
  "Fever", "Cough", "Chest pain", "Abdominal pain", "Headache",
  "Shortness of breath", "Nausea / vomiting", "Rash", "Sore throat", "Dizziness",
];

import { DIAGNOSE_COOLDOWN_MS } from "@/lib/constants";

const emptyCase: PatientCase = {
  name: "", sex: "male", age: null, chiefComplaints: [],
  history: {}, exam: {}, investigations: [],
};

function buildFallbackPresentation(patientCase: PatientCase): string {
  const lines = [
    `This is ${patientCase.name || "the patient"}, a ${patientCase.age ?? "unknown"}-year-old ${patientCase.sex} presenting with ${patientCase.chiefComplaints.join(", ") || "symptoms"}.`,
  ];
  if (Object.keys(patientCase.history).length) {
    lines.push(`History: ${JSON.stringify(patientCase.history)}`);
  }
  if (Object.keys(patientCase.exam).length) {
    lines.push(`Examination: ${JSON.stringify(patientCase.exam)}`);
  }
  return lines.join("\n\n");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { Sex };

export function useCaseWizard(mode: Mode) {
  const [phase, setPhase] = useState<Phase>("demographics");
  const [patientCase, setPatientCase] = useState<PatientCase>(emptyCase);
  const [stepStack, setStepStack] = useState<StepRecord[]>([]);
  const [currentStep, setCurrentStep] = useState<ClinicalStepResponse | null>(null);
  const [stepAnswer, setStepAnswer] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [customDetail, setCustomDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [diagnosisAiPowered, setDiagnosisAiPowered] = useState<boolean | null>(null);
  const [presentation, setPresentation] = useState<ClassicPresentation | null>(null);
  const [presentationAiPowered, setPresentationAiPowered] = useState<boolean | null>(null);
  const [customComplaint, setCustomComplaint] = useState("");
  const [saved, setSaved] = useState(false);
  const [aiInsight, setAiInsight] = useState<ClinicalAiInsight | null>(null);
  const [aiInsightIsLocal, setAiInsightIsLocal] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  const [coPilotInsight, setCoPilotInsight] = useState<CoPilotInsight | null>(null);
  const [coPilotLoading, setCoPilotLoading] = useState(false);
  const [coPilotError, setCoPilotError] = useState<string | null>(null);
  const [coPilotStale, setCoPilotStale] = useState(false);
  const [contradiction, setContradiction] = useState<ClinicalContradiction | null>(null);
  const [contradictionClarification, setContradictionClarification] = useState("");
  const pendingContradiction = useRef<{ updated: PatientCase; newStack: StepRecord[] } | null>(null);
  const aiCheckVersion = useRef(0);
  const aiAbortRef = useRef<AbortController | null>(null);

  const apiBase = mode === "classic" ? "/api/classic" : "/api/clinical";
  const complaintPool = BASE_COMPLAINTS;

  const refreshLocalInsight = useCallback(
    (caseData: PatientCase) => {
      if (mode !== "clinical" || caseData.chiefComplaints.length === 0) return;
      setAiInsight(getLocalClinicalInsight(caseData));
      setAiInsightIsLocal(true);
      setAiError(null);
    },
    [mode],
  );

  const fetchAiDifferentials = useCallback(async (caseData: PatientCase) => {
    if (mode !== "clinical" || caseData.chiefComplaints.length === 0) return;

    try {
      const res = await fetch("/api/clinical/differentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientCase: caseData }),
      });
      const data = await res.json();
      if (res.ok && data?.insight?.leadingDiagnosis) {
        setAiInsight(data.insight);
        setAiInsightIsLocal(false);
        setAiError(null);
      }
    } catch {
      // Fallback already set by refreshLocalInsight — silently ignore
    }
  }, [mode]);

  useEffect(() => {
    if (coPilotInsight) {
      setCoPilotStale(true);
    }
  }, [patientCase, coPilotInsight]);

  // Refresh AI differentials when the complete step is shown
  useEffect(() => {
    if (mode === "clinical" && currentStep?.fieldKey === "complete" && patientCase.chiefComplaints.length > 0) {
      refreshLocalInsight(patientCase);
      fetchAiDifferentials(patientCase);
    }
  }, [currentStep?.fieldKey, mode, patientCase, refreshLocalInsight, fetchAiDifferentials]);

  const analyzeCoPilot = useCallback(async () => {
    if (mode !== "clinical" || patientCase.chiefComplaints.length === 0) return;

    setCoPilotLoading(true);
    setCoPilotError(null);

    try {
      const res = await fetch("/api/clinical/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientCase, aiInsight }),
      });
      const data = await res.json();

      const insight = data?.insight ?? data;

      if (!res.ok || !insight?.keyQuestions) {
        const message = formatAiError(data?.aiError ?? data?.error ?? "Co-Pilot analysis failed");
        setCoPilotError(message);
        return;
      }

      setCoPilotInsight(insight as CoPilotInsight);
      setCoPilotStale(false);
    } catch (error) {
      setCoPilotError(formatAiError((error as Error)?.message ?? String(error)));
    } finally {
      setCoPilotLoading(false);
    }
  }, [aiInsight, mode, patientCase]);

  const fetchNextStep = useCallback(
    async (caseData: PatientCase, stack: StepRecord[] = []) => {
      setLoading(true);
      try {
        const completedKeys = stack.map((s) => s.fieldKey);
        const res = await fetch(`${apiBase}/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientCase: caseData, completedKeys }),
        });
        const data = await res.json();
        setCurrentStep(data.step ?? null);
        setStepAnswer([]);
        setTextAnswer("");
        setCustomDetail("");
      } catch {
        setCurrentStep(null);
      } finally {
        setLoading(false);
      }
    },
    [apiBase],
  );

  const fetchDiagnosis = useCallback(async (caseData: PatientCase) => {
    aiAbortRef.current?.abort();
    setAiError(null);
    setDiagnosing(true);
    setLoading(true);

    try {
      await sleep(DIAGNOSE_COOLDOWN_MS);

      const res = await fetch("/api/clinical/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientCase: caseData }),
      });
      const data = await res.json();

      if (!res.ok || !data.diagnosis) {
        const message = formatAiError(data.aiError ?? data.error ?? "Failed to generate diagnosis");
        setAiError(message);
        setDiagnosis(data.diagnosis ?? null);
        setDiagnosisAiPowered(false);
        if (data.diagnosis) setPhase("results");
        return;
      }

      setDiagnosisAiPowered(Boolean(data.aiPowered));
      setAiError(data.aiPowered ? null : data.aiError ? formatAiError(data.aiError) : null);
      setDiagnosis(data.diagnosis);
      if (data.aiPowered && data.diagnosis) {
        setAiInsight(diagnosisToInsight(data.diagnosis));
        setAiInsightIsLocal(false);
      }
      setPhase("results");
    } finally {
      setDiagnosing(false);
      setLoading(false);
    }
  }, []);

  const retryDiagnosis = useCallback(async () => {
    if (!patientCase.chiefComplaints.length) return;
    await fetchDiagnosis(patientCase);
  }, [patientCase, fetchDiagnosis]);

  const fetchPresentation = useCallback(async (caseData: PatientCase) => {
    setLoading(true);
    try {
      const res = await fetch("/api/classic/present", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientCase: caseData }),
      });
      const data = await res.json();
      if (!res.ok || !data?.presentation) {
        throw new Error(data?.error ?? "Presentation response missing");
      }
      setPresentation(data.presentation);
      setPresentationAiPowered(Boolean(data.aiPowered));
      if (data.aiError) setAiError(data.aiError);
      setPhase("presentation");
    } catch {
      setPresentation({
        oneLiner: `${caseData.name || "Patient"}, ${caseData.age ?? "unknown"}y, presenting with ${caseData.chiefComplaints.join(", ") || "symptoms"}.`,
        fullPresentation: buildFallbackPresentation(caseData),
        keyPoints: ["Complete history collected", "Presentation could not be generated by AI"],
        suggestedQuestions: ["What is your leading diagnosis?", "What investigations would you order?"],
      });
      setPresentationAiPowered(false);
      setPhase("presentation");
    } finally {
      setLoading(false);
    }
  }, []);

  const goToComplaints = () => {
    if (!patientCase.name.trim() || patientCase.age == null || patientCase.age < 0) return;
    setPatientCase((p) => ({ ...p, sex: p.sex || "male" }));
    setPhase("complaints");
  };

  const goToDynamic = async () => {
    if (patientCase.chiefComplaints.length === 0) return;
    setPhase("dynamic");
    setStepStack([]);
    await fetchNextStep(patientCase, []);
    refreshLocalInsight(patientCase);
  };

  const applyAnswer = (caseData: PatientCase, step: ClinicalStepResponse, value: string | string[] | boolean) => {
    const updated = { ...caseData };
    if (step.category === "exam") {
      updated.exam = { ...updated.exam, [step.fieldKey]: value as string | string[] };
    } else if (step.category === "investigations") {
      updated.investigations = Array.isArray(value) ? value : [String(value)];
    } else if (step.fieldKey !== "complete") {
      updated.history = { ...updated.history, [step.fieldKey]: value };
    }
    return updated;
  };

  const advanceStep = async (updated: PatientCase, newStack: StepRecord[]) => {
    setStepStack(newStack);
    setPatientCase(updated);
    refreshLocalInsight(updated);
    // Fire-and-forget AI differentials update: show local preview instantly,
    // then replace with AI-powered version when it arrives
    fetchAiDifferentials(updated);
    await fetchNextStep(updated, newStack);
  };

  const submitStep = async () => {
    if (!currentStep) return;

    if (currentStep.category === "complete" || currentStep.fieldKey === "complete") {
      if (mode === "classic") await fetchPresentation(patientCase);
      else await fetchDiagnosis(patientCase);
      return;
    }

    const value = buildStepValue(currentStep, stepAnswer, textAnswer, customDetail);
    const updated = applyAnswer(patientCase, currentStep, value);
    const newStack = [...stepStack, { fieldKey: currentStep.fieldKey, category: currentStep.category }];

    const detected = detectContradictions(updated, currentStep.fieldKey, value);
    if (detected.length > 0) {
      setContradiction(detected[0]);
      setContradictionClarification("");
      pendingContradiction.current = { updated, newStack };
      return;
    }

    // Rule-based check passed — fire AI deep scan asynchronously
    const version = ++aiCheckVersion.current;
    aiDetectContradictions(updated).then((aiDetected) => {
      if (aiDetected.length > 0 && version === aiCheckVersion.current) {
        setContradiction(aiDetected[0]);
        setContradictionClarification("");
        pendingContradiction.current = { updated, newStack };
      }
    });

    await advanceStep(updated, newStack);
  };

  const resolveContradiction = async () => {
    if (!pendingContradiction.current || !currentStep) return;
    const { updated, newStack } = pendingContradiction.current;

    if (contradictionClarification.trim()) {
      const existing = updated.history[currentStep.fieldKey];
      const clarification = `[CLARIFIED: ${contradictionClarification.trim()}]`;
      if (Array.isArray(existing)) {
        updated.history = { ...updated.history, [currentStep.fieldKey]: [...existing, clarification] };
      } else if (typeof existing === "string") {
        updated.history = { ...updated.history, [currentStep.fieldKey]: `${existing} ${clarification}` };
      } else {
        updated.history = { ...updated.history, [`${currentStep.fieldKey}_clarification`]: clarification };
      }
    }

    setContradiction(null);
    setContradictionClarification("");
    pendingContradiction.current = null;
    await advanceStep(updated, newStack);
  };

  const dismissContradiction = () => {
    setContradiction(null);
    setContradictionClarification("");
    pendingContradiction.current = null;
  };

  const skipStep = async () => {
    if (!currentStep || currentStep.fieldKey === "complete") return;
    const value = buildSkippedValue(currentStep);
    const updated = applyAnswer(patientCase, currentStep, value);
    const newStack = [...stepStack, { fieldKey: currentStep.fieldKey, category: currentStep.category }];
    await advanceStep(updated, newStack);
  };

  const goBack = async () => {
    if (contradiction) {
      dismissContradiction();
      return;
    }
    if (phase === "complaints") {
      setPhase("demographics");
      return;
    }
    if (phase === "dynamic" && stepStack.length === 0) {
      setPhase("complaints");
      return;
    }
    if (phase === "dynamic" && stepStack.length > 0) {
      const last = stepStack[stepStack.length - 1];
      const updated = { ...patientCase };

      if (last.category === "exam") {
        const { [last.fieldKey]: _unused, ...rest } = updated.exam;
        void _unused;
        updated.exam = rest;
      } else if (last.category === "investigations") {
        updated.investigations = [];
      } else {
        const { [last.fieldKey]: _unused, ...rest } = updated.history;
        void _unused;
        updated.history = rest;
      }

      const newStack = stepStack.slice(0, -1);
      setStepStack(newStack);
      setPatientCase(updated);
      await fetchNextStep(updated, newStack);
      refreshLocalInsight(updated);
    }
  };

  const saveCase = () => {
    const entry: SavedCase = {
      id: `${mode}-${Date.now()}`,
      mode,
      title: `${patientCase.name} — ${patientCase.chiefComplaints.join(", ") || "case"}`,
      subject: mode === "clinical"
        ? diagnosis?.primaryDiagnosis
        : mode === "classic"
          ? presentation?.oneLiner
          : undefined,
      tags: patientCase.chiefComplaints,
      savedAt: Date.now(),
      patientCase,
      diagnosis: diagnosis ?? undefined,
      presentation: presentation ?? undefined,
    };
    saveToLibrary(entry);
    setSaved(true);
  };

  const reset = () => {
    setPhase("demographics");
    setPatientCase(emptyCase);
    setStepStack([]);
    setCurrentStep(null);
    setDiagnosis(null);
    setDiagnosisAiPowered(null);
    setPresentation(null);
    setPresentationAiPowered(null);
    setAiInsight(null);
    setAiInsightIsLocal(true);
    setAiError(null);
    setCoPilotInsight(null);
    setCoPilotLoading(false);
    setCoPilotError(null);
    setCoPilotStale(false);
    setDiagnosing(false);
    setSaved(false);
  };

  const toggleComplaint = (c: string) => {
    setPatientCase((prev) => ({
      ...prev,
      chiefComplaints: prev.chiefComplaints.includes(c)
        ? prev.chiefComplaints.filter((x) => x !== c)
        : [...prev.chiefComplaints, c],
    }));
  };

  const addCustomComplaint = () => {
    const t = customComplaint.trim();
    if (!t) return;
    setPatientCase((p) => ({ ...p, chiefComplaints: [...new Set([...p.chiefComplaints, t])] }));
    setCustomComplaint("");
  };

  const progress =
    phase === "demographics" ? 8
      : phase === "complaints" ? 16
        : phase === "dynamic"
          ? 16 + Math.min(stepStack.length * 7, 70)
          : 100;

  return {
    mode,
    phase,
    patientCase,
    setPatientCase,
    stepStack,
    currentStep,
    stepAnswer,
    setStepAnswer,
    textAnswer,
    setTextAnswer,
    customDetail,
    setCustomDetail,
    loading,
    diagnosing,
    diagnosis,
    diagnosisAiPowered,
    presentation,
    presentationAiPowered,
    customComplaint,
    setCustomComplaint,
    complaintPool,
    progress,
    saved,
    aiInsight,
    aiInsightIsLocal,
    aiError,
    coPilotInsight,
    coPilotLoading,
    coPilotError,
    coPilotStale,
    analyzeCoPilot,
    contradiction,
    contradictionClarification,
    setContradictionClarification,
    resolveContradiction,
    dismissContradiction,
    goToComplaints,
    goToDynamic,
    submitStep,
    skipStep,
    goBack,
    saveCase,
    reset,
    retryDiagnosis,
    toggleComplaint,
    addCustomComplaint,
  };
}