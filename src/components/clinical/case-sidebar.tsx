"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ClinicalAiInsight, PatientCase } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CaseSidebar({
  patientCase,
  aiInsight,
  aiLoading,
  className,
}: {
  patientCase: PatientCase;
  aiInsight?: ClinicalAiInsight | null;
  aiLoading?: boolean;
  className?: string;
}) {
  return (
    <>
      {aiInsight && (
        <div className="mb-4 lg:hidden">
          <AiInsightPanel insight={aiInsight} loading={aiLoading} compact />
        </div>
      )}

      <aside className={cn("hidden w-80 shrink-0 flex-col gap-4 lg:flex", className)}>
        <div className="sticky top-6 space-y-4">
          {aiInsight ? (
            <AiInsightPanel insight={aiInsight} loading={aiLoading} />
          ) : aiLoading ? (
            <AiLoadingCard />
          ) : null}

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

function AiInsightPanel({
  insight,
  loading,
  compact,
}: {
  insight: ClinicalAiInsight;
  loading?: boolean;
  compact?: boolean;
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
            AI clinical reasoning
          </h3>
        </div>
        <UrgencyBadge urgency={insight.urgency} />
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

      {loading && (
        <p className="mt-2 animate-pulse text-[10px] text-muted">Updating reasoning…</p>
      )}
    </motion.div>
  );
}

function AiLoadingCard() {
  return (
    <div className="rounded-2xl border border-accent/20 bg-surface/60 p-5">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        <p className="text-xs text-muted">AI analysing case…</p>
      </div>
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
