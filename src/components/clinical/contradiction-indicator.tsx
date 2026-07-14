"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import type { ClinicalContradiction } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ContradictionIndicator({
  contradictions,
  expandedIdx,
  onToggleExpand,
  onResolve,
  onDismiss,
}: {
  contradictions: ClinicalContradiction[];
  expandedIdx: number | null;
  onToggleExpand: (idx: number) => void;
  onResolve: (idx: number, clarification: string) => void;
  onDismiss: (idx: number) => void;
}) {
  const [clarifications, setClarifications] = useState<Record<number, string>>({});
  const panelId = useId();
  const reduceMotion = useReducedMotion();

  if (contradictions.length === 0) return null;

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-2 lg:bottom-6 lg:right-6">
      <AnimatePresence>
        {expandedIdx !== null && contradictions[expandedIdx] && (
          <motion.div
            key={expandedIdx}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            className="w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-4 shadow-xl"
            id={panelId}
            role="region"
            aria-label="Clinical inconsistency details"
          >
            <ContradictionDetail
              contradiction={contradictions[expandedIdx]}
              clarification={clarifications[expandedIdx] ?? ""}
              onClarificationChange={(v) =>
                setClarifications((prev) => ({ ...prev, [expandedIdx]: v }))
              }
              onResolve={() => {
                onResolve(expandedIdx, clarifications[expandedIdx] ?? "");
                setClarifications((prev) => {
                  const next = { ...prev };
                  delete next[expandedIdx];
                  return next;
                });
              }}
              onDismiss={() => {
                onDismiss(expandedIdx);
                setClarifications((prev) => {
                  const next = { ...prev };
                  delete next[expandedIdx];
                  return next;
                });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <motion.button
          type="button"
          onClick={() => {
            if (expandedIdx !== null) {
              onToggleExpand(expandedIdx);
            } else if (contradictions.length > 0) {
              onToggleExpand(0);
            }
          }}
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-red-300 bg-red-50 text-red-700 shadow-lg transition-colors hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
          aria-expanded={expandedIdx !== null}
          aria-controls={expandedIdx !== null ? panelId : undefined}
          aria-label={`${contradictions.length} clinical ${contradictions.length === 1 ? "inconsistency" : "inconsistencies"} detected`}
        >
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />

          {contradictions.length > 1 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
              {contradictions.length}
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}

function ContradictionDetail({
  contradiction,
  clarification,
  onClarificationChange,
  onResolve,
  onDismiss,
}: {
  contradiction: ClinicalContradiction;
  clarification: string;
  onClarificationChange: (v: string) => void;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const clarificationId = useId();
  const typeLabel: Record<string, string> = {
    direct: "Direct contradiction",
    timeline: "Timeline conflict",
    severity: "Severity mismatch",
    logical: "Logical conflict",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {typeLabel[contradiction.type] ?? "Inconsistency"}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            contradiction.severity === "high"
              ? "bg-red-500/15 text-red-500"
              : "bg-amber-500/15 text-amber-500",
          )}
        >
          {contradiction.severity}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-foreground/80">{contradiction.detail}</p>

      <div className="rounded-xl border border-border/40 bg-surface/40 p-3">
        <p className="text-[11px] font-medium text-muted">Clinical significance</p>
        <p className="mt-1 text-xs leading-relaxed text-foreground/70">
          {contradiction.clinicalSignificance}
        </p>
      </div>

      <div className="rounded-xl border border-border/40 bg-surface/40 p-3">
        <p className="text-[11px] font-medium text-muted">Clarification prompt</p>
        <p className="mt-1 text-xs leading-relaxed text-foreground/70">
          {contradiction.clarificationPrompt}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={clarificationId} className="text-xs font-medium text-foreground">
          Clarification (optional)
        </label>
        <textarea
          id={clarificationId}
          value={clarification}
          onChange={(e) => onClarificationChange(e.target.value)}
          placeholder="Add relevant context"
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onResolve}
          className="min-h-11 flex-1 rounded-xl bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition hover:bg-accent/90"
        >
          Clarify & resolve
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-11 rounded-xl border border-border px-3 py-2 text-xs text-muted transition hover:bg-background"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
