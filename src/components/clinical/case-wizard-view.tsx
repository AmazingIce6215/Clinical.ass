"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AppShell,
  ButtonLink,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
} from "@/components/app-shell";
import { CaseSidebar, CaseSummarySidebar, CoPilotSidebar } from "@/components/clinical/case-sidebar";
import { ReasoningTreeView } from "@/components/clinical/reasoning-tree";
import { DiagnosisLoadingOverlay } from "@/components/clinical/diagnosis-loading-overlay";
import { ReasonBanner, StepInput } from "@/components/clinical/step-input";
import { ContradictionIndicator } from "@/components/clinical/contradiction-indicator";
import { FadeSlide, ProgressBar } from "@/components/motion";
import { ChipGrid, SegmentedControl, TextField } from "@/components/ui/inputs";
import { useCaseWizard } from "@/hooks/use-case-wizard";
import type { PatientCase, Sex, ClassicPresentation, DiagnosisResult } from "@/lib/types";
import { isStepValid } from "@/lib/step-utils";
import { buildReasoningTree } from "@/lib/reasoning-tree";
import { cn } from "@/lib/utils";

export function CaseWizardView({ mode }: { mode: "clinical" | "classic" }) {
  const w = useCaseWizard(mode);
  const isClassic = mode === "classic";
  const isComplete = w.currentStep?.fieldKey === "complete";

  return (
    <>
    <DiagnosisLoadingOverlay
      visible={!isClassic && w.diagnosing}
      patientName={w.patientCase.name}
      complaints={w.patientCase.chiefComplaints}
    />
    <AppShell
      backHref="/dashboard"
      title={isClassic ? "Case presentation" : "Clinical reasoning"}
      subtitle={
        isClassic
          ? "De-identified history → AI-assisted case presentation"
          : "De-identified findings → AI-assisted reasoning review"
      }
    >
      <h1 className="sr-only">{isClassic ? "Case presentation" : "Clinical reasoning"}</h1>
      <p className="mb-3 rounded-xl border border-border bg-surface p-3 text-xs leading-5 text-muted">
        For supervised educational use only. Do not enter identifiable patient information or rely
        on generated suggestions as a substitute for clinical judgment or senior review.
      </p>
      {!isClassic && (
        <p className="mb-4 text-xs text-muted">
          Enter de-identified findings from the encounter. Generated prompts may help you consider what to clarify.
        </p>
      )}
      {isClassic && (
        <p className="mb-4 text-xs text-muted">
          Build a systematic history and generate a case presentation to review with a supervisor. Skip questions that are not relevant.
        </p>
      )}
      <div className="mb-6">
        <ProgressBar value={w.progress} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <div className="space-y-4 lg:sticky lg:top-6">
            <CaseSidebar
              key={w.phase === "results" ? "results" : "workup"}
              patientCase={w.patientCase}
              aiInsight={isClassic ? undefined : w.aiInsight}
              aiInsightIsLocal={isClassic ? undefined : w.aiInsightIsLocal}
              aiError={
                isClassic || w.phase === "results"
                  ? undefined
                  : w.aiError
              }
              minimizeAi={!isClassic && w.phase === "results"}
            />
            {w.phase !== "results" && w.phase !== "presentation" && (
              <div className="hidden lg:block">
                <CoPilotSidebar
                  insight={isClassic ? undefined : w.coPilotInsight}
                  loading={isClassic ? undefined : w.coPilotLoading}
                  error={isClassic ? undefined : w.coPilotError}
                  stale={isClassic ? undefined : w.coPilotStale}
                  onAnalyze={isClassic ? undefined : w.analyzeCoPilot}
                />
              </div>
            )}
            <div className="hidden lg:block">
              <CaseSummarySidebar patientCase={w.patientCase} />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {w.phase === "demographics" && (
              <FadeSlide key="demo">
                <WizardCard step={1} title="Patient details" subtitle="Record only de-identified details from the encounter.">
                  <div className="space-y-5">
                    <TextField
                      label="Initials or placeholder"
                      value={w.patientCase.name}
                      onChange={(v) => w.setPatientCase((p) => ({ ...p, name: v }))}
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
                        value={w.patientCase.sex || "male"}
                        onChange={(v) => w.setPatientCase((p) => ({ ...p, sex: v }))}
                      />
                    </div>
                    <TextField
                      label="Age (years)"
                      type="number"
                      value={w.patientCase.age?.toString() ?? ""}
                      onChange={(v) =>
                        w.setPatientCase((p) => ({ ...p, age: v ? parseInt(v, 10) : null }))
                      }
                      placeholder="e.g. 24"
                    />
                  </div>
                  <NavRow
                    onBack={null}
                    onNext={w.goToComplaints}
                    nextDisabled={
                      !w.patientCase.name.trim() ||
                      w.patientCase.age == null ||
                      w.patientCase.age < 0
                    }
                  />
                </WizardCard>
              </FadeSlide>
            )}

            {w.phase === "complaints" && (
              <FadeSlide key="cc">
                <WizardCard step={2} title="Presenting complaint(s)" subtitle="Select all that apply — add custom complaints too.">
                  <ChipGrid
                    options={w.complaintPool}
                    selected={w.patientCase.chiefComplaints}
                    onToggle={w.toggleComplaint}
                  />
                  <div className="mt-5 flex gap-2">
                    <input
                      value={w.customComplaint}
                      onChange={(e) => w.setCustomComplaint(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && w.addCustomComplaint()}
                      placeholder="Add another complaint…"
                      aria-label="Add another presenting complaint"
                      className="flex-1 rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none focus:border-accent/50"
                    />
                    <SecondaryButton onClick={w.addCustomComplaint}>Add</SecondaryButton>
                  </div>
                  <NavRow
                    onBack={w.goBack}
                    onNext={w.goToDynamic}
                    nextDisabled={w.patientCase.chiefComplaints.length === 0}
                  />
                </WizardCard>
              </FadeSlide>
            )}

            {w.phase === "dynamic" && w.loading && !w.currentStep && (
              <FadeSlide key="load">
                <GlassCard className="max-w-2xl py-12 text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
                  <p className="mt-4 text-sm text-muted">Preparing the next clinical question…</p>
                </GlassCard>
              </FadeSlide>
            )}

            {w.phase === "dynamic" && w.currentStep && (
              <FadeSlide key={`s-${w.currentStep.fieldKey}`}>
                <WizardCard
                  step={3 + w.stepStack.length}
                  title={w.currentStep.sectionLabel ?? "Clinical workup"}
                  subtitle={w.currentStep.question}
                >
                  {w.currentStep.reasonForAsking && (
                    <ReasonBanner reason={w.currentStep.reasonForAsking} />
                  )}
                  {w.currentStep.teachingPearl && (
                    <p className="mb-4 text-xs text-muted">
                      <span className="font-medium text-accent">Pearl: </span>
                      {w.currentStep.teachingPearl}
                    </p>
                  )}
                  <StepInput
                    step={w.currentStep}
                    stepAnswer={w.stepAnswer}
                    setStepAnswer={w.setStepAnswer}
                    textAnswer={w.textAnswer}
                    setTextAnswer={w.setTextAnswer}
                    customDetail={w.customDetail}
                    setCustomDetail={w.setCustomDetail}
                  />

                  <NavRow
                    onBack={w.goBack}
                    onNext={w.submitStep}
                    onSkip={!isComplete ? w.skipStep : undefined}
                    nextLabel={
                      isComplete
                        ? w.loading
                          ? (isClassic ? "Generating presentation…" : "Analyzing case…")
                          : isClassic
                            ? "Generate presentation"
                            : "Generate assessment"
                        : w.loading
                          ? "Loading…"
                          : "Continue"
                    }
                    nextDisabled={
                      isComplete
                        ? w.loading
                        : w.loading ||
                          !isStepValid(w.currentStep, w.stepAnswer, w.textAnswer, w.customDetail)
                    }
                  />
                </WizardCard>
              </FadeSlide>
            )}

            {w.phase === "results" && w.diagnosis && (
              <FadeSlide key="res">
                <ClinicalResults
                  diagnosis={w.diagnosis}
                  aiPowered={Boolean(w.diagnosisAiPowered)}
                  aiNotice={w.aiError}
                  onRetry={w.retryDiagnosis}
                  retrying={w.diagnosing}
                  onReset={w.reset}
                  onSave={w.saveCase}
                  saved={w.saved}
                  patientCase={w.patientCase}
                />
              </FadeSlide>
            )}

            {w.phase === "presentation" && w.presentation && (
              <FadeSlide key="pres">
                <ClassicResults
                  presentation={w.presentation}
                  aiPowered={Boolean(w.presentationAiPowered)}
                  onReset={w.reset}
                  onSave={w.saveCase}
                  saved={w.saved}
                />
              </FadeSlide>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ContradictionIndicator
        contradictions={w.activeContradictions}
        expandedIdx={w.expandedContradictionIdx}
        onToggleExpand={w.setExpandedContradictionIdx}
        onResolve={w.resolveContradiction}
        onDismiss={w.dismissContradiction}
      />
    </AppShell>
    </>
  );
}

function WizardCard({
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
      <div className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-4">
        <motion.div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-xs font-bold text-accent sm:h-10 sm:w-10 sm:text-sm">
          {step}
        </motion.div>
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>
        </div>
      </div>
      {children}
    </GlassCard>
  );
}

function NavRow({
  onBack,
  onNext,
  onSkip,
  nextDisabled,
  nextLabel = "Continue",
}: {
  onBack: (() => void) | null;
  onNext: () => void;
  onSkip?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-stretch gap-2 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="order-2 sm:order-1">
        {onBack ? <SecondaryButton onClick={onBack} className="w-full sm:w-auto">Back</SecondaryButton> : null}
      </div>
      <div className="order-1 flex gap-2 sm:order-2">
        {onSkip && (
          <SecondaryButton onClick={onSkip} className="flex-1 text-muted sm:flex-initial sm:w-auto">
            Skip
          </SecondaryButton>
        )}
        <PrimaryButton onClick={onNext} disabled={nextDisabled} className="flex-1 sm:flex-initial">
          {nextLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ClinicalResults({
  diagnosis,
  aiPowered,
  onRetry,
  retrying,
  onReset,
  onSave,
  saved,
  patientCase,
}: {
  diagnosis: DiagnosisResult;
  aiPowered: boolean;
  aiNotice?: string | null;
  onRetry: () => void;
  retrying: boolean;
  onReset: () => void;
  onSave: () => void;
  saved: boolean;
  patientCase: PatientCase;
}) {
  const redFlags = diagnosis.redFlags.map((r) =>
    typeof r === "string" ? r : `${r.flag} — ${r.whyItMatters}`,
  );

  return (
    <div className="max-w-3xl space-y-4">
      {!aiPowered && (
        <GlassCard className="border-amber-500/30 bg-amber-500/10">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            AI-generated assistance is temporarily unavailable. A template-based educational
            assessment is shown instead; verify it independently.
          </p>
          <SecondaryButton className="mt-4" onClick={onRetry} disabled={retrying}>
            {retrying ? "Retrying assessment…" : "Retry AI assessment"}
          </SecondaryButton>
        </GlassCard>
      )}
      <GlassCard>
        <p className="text-xs font-semibold uppercase text-accent">
          {aiPowered ? "AI-generated suggested diagnosis" : "Template-based suggested diagnosis"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{diagnosis.primaryDiagnosis}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{diagnosis.clinicalReasoningSummary}</p>
        <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted">
          This is an educational suggestion, not a confirmed diagnosis. Reconcile it with the
          complete clinical picture and local guidance.
        </p>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <ListCard title="Red flags" items={redFlags} variant="danger" />
        <ListCard title="Suggested investigations" items={diagnosis.investigations} />
        <ListCard title="Management considerations" items={diagnosis.management} className="sm:col-span-2" />
        <ListCard title="Teaching points" items={diagnosis.teachingPoints} className="sm:col-span-2" variant="accent" />
      </div>

      <ReasoningTreeView tree={buildReasoningTree(patientCase, diagnosis)} />

      <GlassCard>
        <h3 className="mb-3 font-semibold">Differentials</h3>
        <div className="space-y-3">
          {diagnosis.differentials.map((d) => (
            <div key={d.diagnosis} className="rounded-xl border border-border/60 bg-surface/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-medium">{d.diagnosis}</span>
                </div>
                <span className="shrink-0 text-xs uppercase text-muted">{d.likelihood}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{d.reasoning}</p>
              {d.supportingFindings && d.supportingFindings.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold">Supporting findings</p>
                  <ul className="list-disc ml-5 text-sm text-muted">
                    {d.supportingFindings.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {d.findingsAgainst && d.findingsAgainst.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold">Findings against</p>
                  <ul className="list-disc ml-5 text-sm text-muted">
                    {d.findingsAgainst.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-3 pt-2">
        <PrimaryButton onClick={onReset}>New case</PrimaryButton>
        <SecondaryButton onClick={onSave} disabled={saved}>
          {saved ? "Saved to library" : "Save to library"}
        </SecondaryButton>
        <ButtonLink href="/library">Library</ButtonLink>
        <ButtonLink href="/dashboard">Dashboard</ButtonLink>
      </div>
    </div>
  );
}

function ClassicResults({
  presentation,
  aiPowered,
  onReset,
  onSave,
  saved,
}: {
  presentation: ClassicPresentation;
  aiPowered: boolean;
  onReset: () => void;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase text-accent">One-liner</p>
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[11px] font-semibold",
              aiPowered ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700",
            )}
          >
            {aiPowered ? "AI-generated learning summary" : "Template-based summary"}
          </span>
        </div>
        <p className="mt-2 text-lg font-medium">{presentation.oneLiner}</p>
        <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted">
          Review generated wording against the recorded history before using it in teaching or
          supervised discussion.
        </p>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-3 font-semibold">Full presentation</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {presentation.fullPresentation}
        </p>
      </GlassCard>

      <ListCard title="Key points" items={presentation.keyPoints} variant="accent" />
      <ListCard title="Questions a supervisor may ask" items={presentation.suggestedQuestions} />

      <div className="flex flex-wrap gap-3 pt-2">
        <PrimaryButton onClick={onReset}>New case</PrimaryButton>
        <SecondaryButton onClick={onSave} disabled={saved}>
          {saved ? "Saved to library" : "Save to library"}
        </SecondaryButton>
        <ButtonLink href="/library">Library</ButtonLink>
        <ButtonLink href="/dashboard">Dashboard</ButtonLink>
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
