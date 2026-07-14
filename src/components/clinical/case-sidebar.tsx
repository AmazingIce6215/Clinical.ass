"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert } from "lucide-react";
import { useId, useState } from "react";
import type { ClinicalAiInsight, CoPilotInsight, PatientCase } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CaseSidebar({
  aiInsight,
  aiInsightIsLocal,
  aiError,
  minimizeAi = false,
  className,
}: {
  patientCase: PatientCase;
  aiInsight?: ClinicalAiInsight | null;
  aiInsightIsLocal?: boolean;
  aiError?: string | null;
  minimizeAi?: boolean;
  className?: string;
}) {
  const [userExpanded, setUserExpanded] = useState(false);

  const showAiSection = Boolean(aiError || aiInsight);
  const aiCollapsed = minimizeAi && !userExpanded && Boolean(aiInsight);

  const aiPanel = aiError ? (
    <AiErrorCard message={aiError} />
  ) : aiInsight ? (
    aiCollapsed ? (
      <MinimizedAiPanel
        insight={aiInsight}
        onExpand={() => setUserExpanded(true)}
      />
    ) : (
      <AiInsightPanel
        insight={aiInsight}
        isLocal={aiInsightIsLocal}
        onMinimize={minimizeAi ? () => setUserExpanded(false) : undefined}
      />
    )
  ) : null;

  return (
    <>
      {showAiSection && (
        <div className="mb-4 lg:hidden">
          {aiInsight && (userExpanded ? (
            <AiInsightPanel
              insight={aiInsight}
              isLocal={aiInsightIsLocal}
              onMinimize={() => setUserExpanded(false)}
            />
          ) : (
              <MinimizedAiPanel
                insight={aiInsight}
                onExpand={() => setUserExpanded(true)}
                compact
              />
            ))}
          {aiError && !aiInsight && (
            <AiErrorCard message={aiError} />
          )}
        </div>
      )}

      <aside className={cn("hidden w-80 shrink-0 flex-col gap-4 lg:flex", className)}>
        <div className="sticky top-6 space-y-4">
          {showAiSection ? aiPanel : null}
        </div>
      </aside>
    </>
  );
}

export function CaseSummarySidebar({
  patientCase,
  className,
}: {
  patientCase: PatientCase;
  className?: string;
}) {
  return (
    <aside className={cn("hidden w-72 shrink-0 flex-col gap-4 lg:flex", className)}>
      <div className="sticky top-6 space-y-4">
        <SidebarCard title="Case summary">
          <SummaryRow label="Patient" value={patientCase.name || "—"} />
          <SummaryRow
            label="Demographics"
            value={
              patientCase.sex && patientCase.age
                ? `${patientCase.sex}, ${patientCase.age}y`
                : "—"
            }
          />
          <SummaryRow
            label="Complaints"
            value={patientCase.chiefComplaints.join(", ") || "—"}
          />
        </SidebarCard>

        {Object.keys(patientCase.history).length > 0 && (
          <SidebarCard title="Collected">
            {Object.entries(patientCase.history).map(([k, v]) => (
              <SummaryRow
                key={k}
                label={formatKey(k)}
                value={Array.isArray(v) ? v.join(", ") : String(v)}
              />
            ))}
          </SidebarCard>
        )}

        {Object.keys(patientCase.exam).length > 0 && (
          <SidebarCard title="Exam">
            {Object.entries(patientCase.exam).map(([k, v]) => (
              <SummaryRow
                key={k}
                label={formatKey(k)}
                value={Array.isArray(v) ? v.join(", ") : String(v)}
              />
            ))}
          </SidebarCard>
        )}
      </div>
    </aside>
  );
}

export function CoPilotSidebar({
  insight,
  loading,
  error,
  stale,
  onAnalyze,
  className,
}: {
  insight?: CoPilotInsight | null;
  loading?: boolean;
  error?: string | null;
  stale?: boolean;
  onAnalyze?: () => void;
  className?: string;
}) {
  return (
    <>
      <div className="mb-4 lg:hidden">
        <CoPilotPanel
          insight={insight}
          loading={loading}
          error={error}
          stale={stale}
          onAnalyze={onAnalyze}
        />
      </div>

      <aside className={cn("hidden w-80 shrink-0 flex-col gap-4 lg:flex", className)}>
        <div className="sticky top-6 space-y-4">
          <CoPilotPanel
            insight={insight}
            loading={loading}
            error={error}
            stale={stale}
            onAnalyze={onAnalyze}
          />
        </div>
      </aside>
    </>
  );
}

function MinimizedAiPanel({
  insight,
  onExpand,
  compact,
}: {
  insight: ClinicalAiInsight;
  onExpand: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-xl border border-accent/25 bg-surface px-4 py-3 text-left transition hover:border-accent/40 hover:bg-background",
        compact ? "py-2.5" : "py-3",
      )}
      aria-expanded="false"
      aria-label="Expand generated clinical suggestion"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
          Generated suggestion
        </p>
        <p className="truncate text-sm font-medium text-foreground">
          {insight.leadingDiagnosis}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted" aria-hidden>
        Show
      </span>
    </button>
  );
}

function CoPilotPanel({
  insight,
  loading,
  error,
  stale,
  onAnalyze,
}: {
  insight?: CoPilotInsight | null;
  loading?: boolean;
  error?: string | null;
  stale?: boolean;
  onAnalyze?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const contentId = useId();
  const actionLabel = loading ? "Generating…" : insight ? "Refresh" : "Generate";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="min-h-11 text-left"
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            AI learning aid
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            Generated coaching prompts
          </p>
        </button>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading || !onAnalyze}
          className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLabel}
        </button>
      </div>

      {expanded && (
        <div id={contentId} className="space-y-4">
          {error ? (
            <AiErrorCard message={error} />
          ) : insight ? (
            <>
              {stale && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  The recorded case changed after these suggestions were generated. Refresh before
                  reviewing them.
                </div>
              )}

              <p className="text-xs leading-5 text-muted">
                AI-generated learning prompts. Verify each suggestion against the case and
                appropriate clinical guidance.
              </p>

              <SidebarCard title="Suggested questions to ask next">
                <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
                  {insight.keyQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </SidebarCard>

              <SidebarCard title="Suggested examination focus">
                <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
                  {insight.examSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </SidebarCard>

              <SidebarCard title="Possible findings by pathway">
                {insight.expectedFindings.map((item) => (
                  <div key={item.pathway} className="space-y-2 rounded-xl border border-border/50 bg-surface/50 p-3">
                    <p className="text-sm font-semibold text-foreground">{item.pathway}</p>
                    <ul className="ml-4 list-disc space-y-1 text-sm text-muted">
                      {item.findings.map((finding) => (
                        <li key={finding}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </SidebarCard>

              <SidebarCard title="Red flags for review">
                <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
                  {insight.redFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </SidebarCard>
            </>
          ) : (
            <p className="text-sm text-muted">
              Generate educational prompts for questions, examination focus, possible findings,
              and red flags.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AiInsightPanel({
  insight,
  isLocal,
  compact,
  onMinimize,
}: {
  insight: ClinicalAiInsight;
  isLocal?: boolean;
  compact?: boolean;
  onMinimize?: () => void;
}) {
  return (
    <motion.div
      layout
      className={cn(
        "overflow-hidden rounded-xl border border-accent/30 bg-surface shadow-sm",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
            {isLocal ? "Rule-based clinical preview" : "AI-generated clinical suggestions"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isLocal ? (
            <span className="rounded-full border border-border/60 bg-surface/70 px-2 py-0.5 text-[9px] font-semibold uppercase text-muted">
              Local
            </span>
          ) : null}
          <UrgencyBadge urgency={insight.urgency} />
          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              className="min-h-11 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-background hover:text-foreground"
              aria-label="Minimize generated clinical suggestions"
            >
              Minimize
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={insight.leadingDiagnosis}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Suggested leading diagnosis
          </p>
          <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
            {insight.leadingDiagnosis}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">{insight.reasoning}</p>
        </motion.div>
      </AnimatePresence>

      {insight.differentials.length > 0 && (
        <div className="mt-4 space-y-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Suggested differentials
          </p>
          <AnimatePresence mode="popLayout">
            {insight.differentials.map((d, i) => (
              <motion.div
                key={d.diagnosis}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border/50 bg-surface/50 p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium leading-snug">{d.diagnosis}</span>
                  <LikelihoodBadge likelihood={d.likelihood} />
                </div>
                {!compact && d.reasoning && (
                  <p className="mt-1.5 text-[10px] leading-relaxed text-muted">{d.reasoning}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {insight.suggestedInvestigations.length > 0 && !compact && (
        <div className="mt-4 border-t border-border/40 pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Suggested investigations
          </p>
          <ul className="mt-2 space-y-1.5">
            {insight.suggestedInvestigations.map((inv) => (
              <li key={inv.test} className="text-xs">
                <span className="font-medium text-foreground">{inv.test}</span>
                <span className="text-muted"> — {inv.rationale}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLocal && !compact && (
        <p className="mt-3 text-[10px] leading-relaxed text-muted">
          This preview is generated locally from recorded findings. Selecting Generate assessment
          requests a separate AI-generated educational review.
        </p>
      )}
    </motion.div>
  );
}

function AiErrorCard({ message }: { message: string }) {
  const isTemporary = /rate|quota|busy|timeout|network|fetch|temporar/i.test(message);

  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-950"
      role="alert"
    >
      <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
        <CircleAlert className="h-4 w-4" aria-hidden="true" />
        <p className="text-xs font-semibold">
          {isTemporary ? "AI suggestions are temporarily unavailable" : "AI suggestions unavailable"}
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-200">
        Continue with the recorded case and your own clinical reasoning, or try generating the
        suggestions again shortly.
      </p>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: ClinicalAiInsight["urgency"] }) {
  const styles = {
    stable: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    urgent: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emergency: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span
      className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase", styles[urgency])}
      aria-label={`AI-suggested urgency: ${urgency}`}
    >
      {urgency}
    </span>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-muted">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}


function LikelihoodBadge({ likelihood }: { likelihood: string }) {
  const colors: Record<string, string> = {
    high: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    moderate: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    low: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
        colors[likelihood] ?? colors.moderate,
      )}
      aria-label={`AI-suggested likelihood: ${likelihood}`}
    >
      {likelihood}
    </span>
  );
}

function formatKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
