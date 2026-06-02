"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AppShell,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
} from "@/components/app-shell";
import { CaseSidebar } from "@/components/clinical/case-sidebar";
import { FadeSlide, ProgressBar } from "@/components/motion";
import { ChipGrid, SegmentedControl, TextField } from "@/components/ui/inputs";
import type {
  ClinicalStepResponse,
  DiagnosisResult,
  PatientCase,
  Sex,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const COMPLAINTS = [
  "Fever",
  "Cough",
  "Chest pain",
  "Abdominal pain",
  "Headache",
  "Shortness of breath",
  "Nausea / vomiting",
  "Rash",
  "Sore throat",
  "Dizziness",
];

type WizardPhase = "demographics" | "complaints" | "dynamic" | "results";

const emptyCase: PatientCase = {
  name: "",
  sex: "male",
  age: null,
  chiefComplaints: [],
  history: {},
  exam: {},
  investigations: [],
};

export default function ClinicalPage() {
  const [phase, setPhase] = useState<WizardPhase>("demographics");
  const [patientCase, setPatientCase] = useState<PatientCase>(emptyCase);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<ClinicalStepResponse | null>(null);
  const [stepAnswer, setStepAnswer] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [customComplaint, setCustomComplaint] = useState("");

  const progress =
    phase === "demographics"
      ? 15
      : phase === "complaints"
        ? 30
        : phase === "dynamic"
          ? 30 + Math.min(stepIndex * 8, 50)
          : 100;

  const fetchNextStep = useCallback(
    async (caseData: PatientCase, index: number) => {
      setLoading(true);
      try {
        const res = await fetch("/api/clinical/next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientCase: caseData, stepIndex: index }),
        });
        const data = await res.json();
        if (data.step) {
          setCurrentStep(data.step);
        } else {
          const { getFallbackStep } = await import("@/lib/clinical-fallback");
          setCurrentStep(getFallbackStep(caseData, index));
        }
        setStepAnswer([]);
        setTextAnswer("");
      } catch {
        const { getFallbackStep } = await import("@/lib/clinical-fallback");
        setCurrentStep(getFallbackStep(caseData, index));
        setStepAnswer([]);
        setTextAnswer("");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchDiagnosis = useCallback(async (caseData: PatientCase) => {
    setLoading(true);
    try {
      const res = await fetch("/api/clinical/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientCase: caseData }),
      });
      const data = await res.json();
      setDiagnosis(data.diagnosis);
      setPhase("results");
    } finally {
      setLoading(false);
    }
  }, []);

  const goToComplaints = () => {
    const sex = patientCase.sex || "male";
    if (!patientCase.name.trim() || patientCase.age == null || patientCase.age < 0) return;
    setPatientCase((p) => ({ ...p, sex }));
    setPhase("complaints");
  };

  const goToDynamic = async () => {
    if (patientCase.chiefComplaints.length === 0) return;
    setPhase("dynamic");
    await fetchNextStep(patientCase, 0);
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
    const trimmed = customComplaint.trim();
    if (!trimmed) return;
    setPatientCase((prev) => ({
      ...prev,
      chiefComplaints: [...new Set([...prev.chiefComplaints, trimmed])],
    }));
    setCustomComplaint("");
  };

  const submitDynamicStep = async () => {
    if (!currentStep) return;

    const updated: PatientCase = { ...patientCase };

    if (currentStep.category === "exam") {
      const examValue =
        currentStep.inputType === "text" ? textAnswer : stepAnswer.join(", ");
      updated.exam = { ...updated.exam, [currentStep.fieldKey]: examValue };
    } else if (currentStep.category === "investigations") {
      updated.investigations =
        currentStep.inputType === "text"
          ? textAnswer
            ? [textAnswer]
            : []
          : stepAnswer;
    } else {
      const historyValue =
        currentStep.inputType === "text"
          ? textAnswer
          : currentStep.inputType === "yesno"
            ? stepAnswer[0] === "Yes"
            : currentStep.inputType === "multiselect"
              ? stepAnswer
              : stepAnswer[0] ?? "";
      updated.history = { ...updated.history, [currentStep.fieldKey]: historyValue };
    }

    setPatientCase(updated);

    if (currentStep.category === "complete" || currentStep.nextStep === "complete") {
      await fetchDiagnosis(updated);
      return;
    }

    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);

    if (nextIndex >= 8) {
      await fetchDiagnosis(updated);
    } else {
      await fetchNextStep(updated, nextIndex);
    }
  };

  const reset = () => {
    setPhase("demographics");
    setPatientCase(emptyCase);
    setStepIndex(0);
    setCurrentStep(null);
    setDiagnosis(null);
  };

  return (
    <AppShell
      backHref="/"
      title="Clinical Companion"
      subtitle="Guided workup & management"
    >
      <div className="mb-6">
        <ProgressBar value={progress} />
      </div>

      <div className="flex flex-1 gap-8">
        <CaseSidebar
          patientCase={patientCase}
          differentials={currentStep?.workingDifferentials}
        />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            {phase === "demographics" && (
              <FadeSlide key="demo">
                <StepCard
                  step={1}
                  title="Patient details"
                  subtitle="Start with the basics — just like in clinic."
                >
                  <div className="space-y-5">
                    <TextField
                      label="Patient name (or initials)"
                      value={patientCase.name}
                      onChange={(v) => setPatientCase((p) => ({ ...p, name: v }))}
                      placeholder="e.g. J.S."
                    />
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted">Sex</span>
                      <SegmentedControl<Sex>
                        options={[
                          { label: "Male", value: "male" },
                          { label: "Female", value: "female" },
                          { label: "Other", value: "other" },
                        ]}
                        value={patientCase.sex || "male"}
                        onChange={(v) => setPatientCase((p) => ({ ...p, sex: v }))}
                      />
                    </div>
                    <TextField
                      label="Age (years)"
                      type="number"
                      value={patientCase.age?.toString() ?? ""}
                      onChange={(v) =>
                        setPatientCase((p) => ({
                          ...p,
                          age: v ? parseInt(v, 10) : null,
                        }))
                      }
                      placeholder="e.g. 24"
                    />
                  </div>
                  <div className="mt-8 flex justify-end">
                    <PrimaryButton
                      onClick={goToComplaints}
                      disabled={
                        !patientCase.name.trim() ||
                        patientCase.age == null ||
                        patientCase.age < 0
                      }
                    >
                      Continue
                      <span aria-hidden>→</span>
                    </PrimaryButton>
                  </div>
                </StepCard>
              </FadeSlide>
            )}

            {phase === "complaints" && (
              <FadeSlide key="cc">
                <StepCard
                  step={2}
                  title="Chief complaint"
                  subtitle="Tap common presentations or add your own."
                >
                  <ChipGrid
                    options={COMPLAINTS}
                    selected={patientCase.chiefComplaints}
                    onToggle={toggleComplaint}
                  />
                  <div className="mt-5 flex gap-2">
                    <input
                      value={customComplaint}
                      onChange={(e) => setCustomComplaint(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomComplaint()}
                      placeholder="Add custom complaint..."
                      className="flex-1 rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                    />
                    <SecondaryButton onClick={addCustomComplaint}>Add</SecondaryButton>
                  </div>
                  <div className="mt-8 flex justify-between">
                    <SecondaryButton onClick={() => setPhase("demographics")}>
                      Back
                    </SecondaryButton>
                    <PrimaryButton
                      onClick={goToDynamic}
                      disabled={patientCase.chiefComplaints.length === 0}
                    >
                      Continue
                      <span aria-hidden>→</span>
                    </PrimaryButton>
                  </div>
                </StepCard>
              </FadeSlide>
            )}

            {phase === "dynamic" && !currentStep && loading && (
              <FadeSlide key="loading">
                <GlassCard className="max-w-2xl text-center py-12">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
                  <p className="mt-4 text-sm text-muted">Analyzing case...</p>
                </GlassCard>
              </FadeSlide>
            )}

            {phase === "dynamic" && currentStep && (
              <FadeSlide key={`step-${stepIndex}`}>
                <StepCard
                  step={3 + stepIndex}
                  title={formatCategory(currentStep.category)}
                  subtitle={currentStep.question}
                >
                  {currentStep.teachingPearl && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-5 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-muted"
                    >
                      <span className="font-medium text-accent">Pearl: </span>
                      {currentStep.teachingPearl}
                    </motion.div>
                  )}

                  {currentStep.inputType === "chips" ||
                  currentStep.inputType === "multiselect" ? (
                    <ChipGrid
                      options={currentStep.options ?? []}
                      selected={stepAnswer}
                      onToggle={(v) => {
                        if (currentStep.inputType === "multiselect") {
                          setStepAnswer((prev) =>
                            prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
                          );
                        } else {
                          setStepAnswer([v]);
                        }
                      }}
                    />
                  ) : currentStep.inputType === "yesno" ? (
                    <ChipGrid
                      options={["Yes", "No"]}
                      selected={stepAnswer}
                      onToggle={(v) => setStepAnswer([v])}
                    />
                  ) : (
                    <textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      rows={4}
                      placeholder="Enter findings..."
                      className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                    />
                  )}

                  {currentStep.missingCritical &&
                    currentStep.missingCritical.length > 0 && (
                      <p className="mt-4 text-xs text-muted">
                        Still needed: {currentStep.missingCritical.join(", ")}
                      </p>
                    )}

                  <div className="mt-8 flex justify-between">
                    <SecondaryButton
                      onClick={() => {
                        if (stepIndex === 0) setPhase("complaints");
                        else {
                          setStepIndex((i) => i - 1);
                          fetchNextStep(patientCase, stepIndex - 1);
                        }
                      }}
                    >
                      Back
                    </SecondaryButton>
                    <PrimaryButton
                      onClick={submitDynamicStep}
                      disabled={
                        loading ||
                        (currentStep.inputType === "text"
                          ? !textAnswer.trim()
                          : stepAnswer.length === 0)
                      }
                    >
                      {loading ? "Thinking..." : "Next"}
                      {!loading && <span aria-hidden>→</span>}
                    </PrimaryButton>
                  </div>
                </StepCard>
              </FadeSlide>
            )}

            {phase === "results" && diagnosis && (
              <FadeSlide key="results">
                <ResultsView diagnosis={diagnosis} onReset={reset} />
              </FadeSlide>
            )}
          </AnimatePresence>
        </main>
      </div>
    </AppShell>
  );
}

function StepCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="max-w-2xl">
      <div className="mb-6 flex items-start gap-4">
        <motion.div
          layout
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-sm font-bold text-accent"
        >
          {step}
        </motion.div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </GlassCard>
  );
}

function ResultsView({
  diagnosis,
  onReset,
}: {
  diagnosis: DiagnosisResult;
  onReset: () => void;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <GlassCard>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Primary diagnosis
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{diagnosis.primaryDiagnosis}</h2>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold">Differentials</h3>
        <div className="space-y-3">
          {diagnosis.differentials.map((d, i) => (
            <motion.div
              key={d.diagnosis}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border/60 bg-surface/40 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{d.diagnosis}</span>
                <span className="text-xs uppercase text-muted">{d.likelihood}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{d.reasoning}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <ListCard title="Red flags" items={diagnosis.redFlags} variant="danger" />
        <ListCard title="Investigations" items={diagnosis.investigations} />
        <ListCard title="Management" items={diagnosis.management} className="sm:col-span-2" />
        <ListCard
          title="Teaching points"
          items={diagnosis.teachingPoints}
          className="sm:col-span-2"
          variant="accent"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <PrimaryButton onClick={onReset}>New case</PrimaryButton>
        <Link href="/">
          <SecondaryButton>Home</SecondaryButton>
        </Link>
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  className,
  variant,
}: {
  title: string;
  items: string[];
  className?: string;
  variant?: "danger" | "accent";
}) {
  return (
    <GlassCard className={className}>
      <h3
        className={cn(
          "mb-3 font-semibold",
          variant === "danger" && "text-red-500",
          variant === "accent" && "text-accent",
        )}
      >
        {title}
      </h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-accent">•</span>
            {item}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

function formatCategory(cat: string) {
  const map: Record<string, string> = {
    hpi: "History",
    exam: "Examination",
    investigations: "Investigations",
    complete: "Summary",
  };
  return map[cat] ?? "Clinical step";
}
