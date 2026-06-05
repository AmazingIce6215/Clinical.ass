"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ClassicPresentation,
  ClinicalAiInsight,
  ClinicalStepResponse,
  DiagnosisResult,
  PatientCase,
  SavedCase,
  Sex,
} from "@/lib/types";
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
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [presentation, setPresentation] = useState<ClassicPresentation | null>(null);
  const [presentationAiPowered, setPresentationAiPowered] = useState<boolean | null>(null);
  const [customComplaint, setCustomComplaint] = useState("");
  const [saved, setSaved] = useState(false);
  const [aiInsight, setAiInsight] = useState<ClinicalAiInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiDiagnosisPreview = useRef<DiagnosisResult | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiBase = mode === "classic" ? "/api/classic" : "/api/clinical";
  const complaintPool = BASE_COMPLAINTS;

  const fetchAiInsight = useCallback(
    async (
      caseData: PatientCase,
      draft?: { fieldKey: string; category: string; value: string | string[] },
    ) => {
      if (mode !== "clinical" || caseData.chiefComplaints.length === 0) return;

      aiAbortRef.current?.abort();
      const controller = new AbortController();
      aiAbortRef.current = controller;
      setAiLoading(true);

      try {
        const res = await fetch("/api/clinical/differentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientCase: caseData, draft }),
          signal: controller.signal,
        });
        if (!res.ok) {
          setAiError("AI differentials request failed");
          return;
        }
        const data = await res.json();
        setAiError(data.aiError ?? null);
        if (data.insight) setAiInsight(data.insight);
        if (data.diagnosis) aiDiagnosisPreview.current = data.diagnosis;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) setAiLoading(false);
      }
    },
    [mode],
  );

  const scheduleAiRefresh = useCallback(
    (caseData: PatientCase, draft?: { fieldKey: string; category: string; value: string | string[] }) => {
      if (mode !== "clinical") return;
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
      aiDebounceRef.current = setTimeout(() => {
        fetchAiInsight(caseData, draft);
      }, 1000);
    },
    [mode, fetchAiInsight],
  );

  useEffect(() => {
    if (mode !== "clinical" || phase !== "dynamic" || !currentStep) return;
    if (currentStep.fieldKey === "complete") return;

    const draftValue = buildStepValue(currentStep, stepAnswer, textAnswer, customDetail);
    const hasDraft =
      (Array.isArray(draftValue) && draftValue.length > 0) ||
      (typeof draftValue === "string" && draftValue.trim().length > 0);

    if (!hasDraft) return;

    scheduleAiRefresh(patientCase, {
      fieldKey: currentStep.fieldKey,
      category: currentStep.category,
      value: draftValue,
    });
  }, [
    mode,
    phase,
    currentStep,
    stepAnswer,
    textAnswer,
    customDetail,
    patientCase,
    scheduleAiRefresh,
  ]);

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
    if (aiDiagnosisPreview.current) {
      setDiagnosis(aiDiagnosisPreview.current);
      setPhase("results");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clinical/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientCase: caseData }),
      });
      const data = await res.json();
      if (!res.ok || !data.diagnosis) {
        setAiError(data.aiError ?? data.error ?? "Failed to generate diagnosis");
        setDiagnosis(data.diagnosis ?? null);
        if (data.diagnosis) setPhase("results");
        return;
      }
      setAiError(data.aiError ?? null);
      setDiagnosis(data.diagnosis);
      setPhase("results");
    } finally {
      setLoading(false);
    }
  }, []);

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
    aiDiagnosisPreview.current = null;
    await fetchNextStep(patientCase, []);
    if (mode === "clinical") fetchAiInsight(patientCase);
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
    if (mode === "clinical") fetchAiInsight(updated);
    await fetchNextStep(updated, newStack);
  };

  const submitStep = async () => {
    if (!currentStep) return;

    if (currentStep.category === "complete" || currentStep.fieldKey === "complete") {
      if (mode === "classic") await fetchPresentation(patientCase);
      else {
        // Force a full AI synthesis for final diagnosis (don't use the lightweight preview)
        aiAbortRef.current?.abort();
        aiDiagnosisPreview.current = null;
        await fetchDiagnosis(patientCase);
      }
      return;
    }

    const value = buildStepValue(currentStep, stepAnswer, textAnswer, customDetail);
    const updated = applyAnswer(patientCase, currentStep, value);
    const newStack = [...stepStack, { fieldKey: currentStep.fieldKey, category: currentStep.category }];
    await advanceStep(updated, newStack);
  };

  const skipStep = async () => {
    if (!currentStep || currentStep.fieldKey === "complete") return;
    const value = buildSkippedValue(currentStep);
    const updated = applyAnswer(patientCase, currentStep, value);
    const newStack = [...stepStack, { fieldKey: currentStep.fieldKey, category: currentStep.category }];
    await advanceStep(updated, newStack);
  };

  const goBack = () => {
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
      fetchNextStep(updated, newStack);
      if (mode === "clinical") fetchAiInsight(updated);
    }
  };

  const saveCase = () => {
    const entry: SavedCase = {
      id: `${mode}-${Date.now()}`,
      mode,
      title: `${patientCase.name} — ${patientCase.chiefComplaints.join(", ") || "case"}`,
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
    setPresentation(null);
    setPresentationAiPowered(null);
    setAiInsight(null);
    setAiError(null);
    aiDiagnosisPreview.current = null;
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
    diagnosis,
    presentation,
    presentationAiPowered,
    customComplaint,
    setCustomComplaint,
    complaintPool,
    progress,
    saved,
    aiInsight,
    aiLoading,
    aiError,
    goToComplaints,
    goToDynamic,
    submitStep,
    skipStep,
    goBack,
    saveCase,
    reset,
    toggleComplaint,
    addCustomComplaint,
  };
}
