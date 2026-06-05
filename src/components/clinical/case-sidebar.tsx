"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { ClinicalAiInsight, CoPilotInsight, PatientCase } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CaseSidebar({
  patientCase,
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

  const showAiSection = aiError || aiInsight;
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
          {aiCollapsed && aiInsight ? (
            <MinimizedAiPanel
              insight={aiInsight}
              onExpand={() => setUserExpanded(true)}
              compact
            />
          ) : (
            aiPanel
          )}
        </div>
      )}

      <aside className={cn("hidden w-80 shrink-0 flex-col gap-4 lg:flex", className)}>
        <div className="sticky top-6 space-y-4">
          {showAiSection ? aiPanel : null}

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
    </>
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
        "flex w-full items-center gap-3 rounded-2xl border border-accent/25 bg-accent/5 px-4 py-3 text-left transition hover:border-accent/40 hover:bg-accent/10",
        compact ? "py-2.5" : "py-3",
      )}
      aria-expanded="false"
      aria-label="Expand live AI sidebar"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
          Live AI
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
  const actionLabel = loading ? "Analyzing…" : insight ? "Refresh" : "Analyze";

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/60 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-left"
          aria-expanded={expanded}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            CO-PILOT
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            Clinical thinking coach
          </p>
        </button>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading || !onAnalyze}
          className="rounded-xl border border-border/60 bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:border-accent/60 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLabel}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {error ? (
            <AiErrorCard message={error} />
          ) : insight ? (
            <>
              {stale && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Case changed since the last analysis. Refresh to update recommendations.
                </div>
              )}

              <SidebarCard title="Key Clinical Questions to Ask Next">
                {insight.keyQuestions.map((question) => (
                  <p key={question} className="text-sm leading-relaxed text-muted">
                    • {question}
                  </p>
                ))}
              </SidebarCard>

              <SidebarCard title="Focused Examination Steps">
                {insight.examSteps.map((step) => (
                  <p key={step} className="text-sm leading-relaxed text-muted">
                    • {step}
                  </p>
                ))}
              </SidebarCard>

              <SidebarCard title="Expected Findings (Based on Possible Pathways)">
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

              <SidebarCard title="Red Flags Not to Miss">
                {insight.redFlags.map((flag) => (
                  <p key={flag} className="text-sm leading-relaxed text-muted">
                    • {flag}
                  </p>
                ))}
              </SidebarCard>
            </>
          ) : (
            <p className="text-sm text-muted">
              Tap Analyze to get focused coaching on next questions, exam maneuvers, expected findings, and key red flags.
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
        "overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-surface/80 to-surface/60 shadow-soft backdrop-blur-xl",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
            {isLocal ? "Clinical preview" : "AI clinical reasoning"}
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
              className="rounded-lg px-2 py-1 text-[10px] font-medium text-muted transition hover:bg-surface/80 hover:text-foreground"
              aria-label="Minimize live AI sidebar"
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
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Leading</p>
          <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
            {insight.leadingDiagnosis}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">{insight.reasoning}</p>
        </motion.div>
      </AnimatePresence>

      {insight.differentials.length > 0 && (
        <div className="mt-4 space-y-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Working differentials
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
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-border/40">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      d.likelihood === "high"
                        ? "bg-emerald-500"
                        : d.likelihood === "moderate"
                          ? "bg-amber-500"
                          : "bg-slate-400",
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${d.confidence}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
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
          Offline preview while you work up the case. Full AI runs when you tap Diagnose.
        </p>
      )}
    </motion.div>
  );
}

function AiErrorCard({ message }: { message: string }) {
  const isRateLimit = /rate limit/i.test(message);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
      <p className="text-xs font-semibold text-red-700 dark:text-red-300">
        {isRateLimit ? "AI is busy" : "AI unavailable"}
      </p>
      <p className="mt-2 text-sm text-red-600 dark:text-red-200">{message}</p>
      <p className="mt-2 text-xs text-muted">
        {isRateLimit
          ? "Live differentials pause briefly to save your final diagnosis quota."
          : "If this persists, ensure GROQ_API_KEY is configured on your environment."}
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
    <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase", styles[urgency])}>
      {urgency}
    </span>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/60 p-4 backdrop-blur-md">
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
    >
      {likelihood}
    </span>
  );
}

function formatKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
