"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  if (contradictions.length === 0) return null;

  const severityColor =
    contradictions.some((c) => c.severity === "high")
      ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
      : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {expandedIdx !== null && contradictions[expandedIdx] && (
          <motion.div
            key={expandedIdx}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-80 rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-xl backdrop-blur-xl"
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

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => {
          if (expandedIdx !== null) {
            onToggleExpand(expandedIdx);
          } else if (contradictions.length > 0) {
            onToggleExpand(0);
          }
        }}
        className={cn(
          "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-md transition hover:brightness-110",
          severityColor,
        )}
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/20 text-[10px] font-bold text-current">
          {contradictions.length}
        </span>
        <span>
          {contradictions.length === 1
            ? "Clinical inconsistency"
            : `${contradictions.length} clinical inconsistencies`}
        </span>
        <motion.span
          animate={{ rotate: expandedIdx !== null ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-current/60"
        >
          ▼
        </motion.span>
      </motion.button>
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

      <textarea
        value={clarification}
        onChange={(e) => onClarificationChange(e.target.value)}
        placeholder="Your clarification..."
        rows={2}
        className="w-full rounded-xl border border-border/60 bg-surface/60 px-3 py-2 text-xs outline-none focus:border-accent/50"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onResolve}
          className="flex-1 rounded-xl bg-accent/15 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/25"
        >
          Clarify & resolve
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl border border-border/60 px-3 py-2 text-xs text-muted transition hover:bg-surface/60"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
