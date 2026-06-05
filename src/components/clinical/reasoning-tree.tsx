"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { ReasoningNode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReasoningTreeView({ tree }: { tree: ReasoningNode }) {
  const [viewMode, setViewMode] = useState<"simple" | "deep">("deep");

  return (
    <div className="rounded-2xl border border-border/70 bg-surface/80 p-6 shadow-soft backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Clinical Reasoning Tree</h3>
            <p className="text-[11px] text-muted">How the AI arrived at the final diagnosis</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border border-border/50 bg-surface/50 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("simple")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "simple"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            Simple
          </button>
          <button
            type="button"
            onClick={() => setViewMode("deep")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "deep"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            Deep reasoning
          </button>
        </div>
      </div>

      <div className="relative">
        <TreeNode node={tree} depth={0} viewMode={viewMode} isRoot />
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  viewMode,
  isRoot,
}: {
  node: ReasoningNode;
  depth: number;
  viewMode: "simple" | "deep";
  isRoot?: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isFinal = node.type === "final";

  // In simple mode, flatten intermediate nodes
  if (viewMode === "simple") {
    if (node.type === "elimination" && depth > 1) return null;
  }

  const nodeConfig = {
    symptom: {
      border: "border-accent/30",
      bg: "bg-gradient-to-br from-accent/10 to-accent/5",
      icon: "○",
      label: "text-accent font-semibold",
      dot: "bg-accent",
    },
    pathway: {
      border: "border-blue-300/40 dark:border-blue-500/30",
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
      icon: "⊞",
      label: "text-blue-700 dark:text-blue-300 font-medium",
      dot: "bg-blue-400",
    },
    diagnosis: {
      border: "border-amber-300/40 dark:border-amber-500/30",
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
      icon: "▸",
      label: "text-amber-800 dark:text-amber-200 font-medium",
      dot: "bg-amber-400",
    },
    elimination: {
      border: "border-slate-300/40 dark:border-slate-500/30",
      bg: "bg-slate-50/50 dark:bg-slate-900/30",
      icon: "⊘",
      label: "text-slate-500 dark:text-slate-400",
      dot: "bg-slate-400",
    },
    final: {
      border: "border-emerald-400/50 dark:border-emerald-500/40",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-950/30 dark:to-emerald-900/20",
      icon: "◆",
      label: "text-emerald-800 dark:text-emerald-200 font-bold",
      dot: "bg-emerald-500",
    },
  };

  const cfg = nodeConfig[node.type];

  return (
    <div className="relative">
      {/* Vertical connector from parent */}
      {depth > 0 && !isRoot && (
        <div className="absolute left-6 top-0 h-4 w-px bg-border/60" />
      )}

      <div className="relative pl-0">
        {/* Node card */}
        <div
          className={cn(
            "relative rounded-xl border p-4 transition-all",
            cfg.border,
            cfg.bg,
            isFinal && "ring-2 ring-emerald-400/30",
            depth > 0 && "ml-10",
          )}
        >
          <div className="flex items-start gap-3">
            {/* Expand/collapse button */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-medium transition-all",
                  "border-border/60 bg-surface/80 text-muted",
                  "hover:border-accent/40 hover:text-accent hover:bg-accent/5",
                  expanded && "border-accent/30 text-accent",
                )}
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                <svg
                  className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <div className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center">
                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-2">
              {/* Node header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn("text-sm leading-snug", cfg.label)}>
                    {node.label}
                  </p>
                  {node.type === "elimination" && (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Ruled out
                    </span>
                  )}
                  {node.type === "final" && (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Final diagnosis
                    </span>
                  )}
                </div>

                {/* Likelihood badge for diagnosis nodes */}
                {node.type === "diagnosis" && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    Considered
                  </span>
                )}
                {node.type === "pathway" && (
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    System
                  </span>
                )}
              </div>

              {/* Reasoning text */}
              {node.reasoning && viewMode === "deep" && depth < 3 && (
                <div className="rounded-lg border border-border/40 bg-surface/40 px-3 py-2">
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">
                    {node.reasoning}
                  </p>
                </div>
              )}

              {/* Supporting & Against findings */}
              {viewMode === "deep" && (
                <div className="flex flex-wrap gap-3">
                  {node.supporting && node.supporting.length > 0 && (
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Supporting
                      </p>
                      <ul className="space-y-0.5">
                        {node.supporting.map((s) => (
                          <li key={s} className="flex items-start gap-2 text-xs text-muted">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/60" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {node.against && node.against.length > 0 && (
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Against
                      </p>
                      <ul className="space-y-0.5">
                        {node.against.map((a) => (
                          <li key={a} className="flex items-start gap-2 text-xs text-muted">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/60" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && expanded && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative overflow-hidden"
            >
              {/* Vertical connector line */}
              <div className="absolute left-[23px] top-0 w-px bg-border/50" style={{ height: "calc(100% - 12px)" }} />

              <div className="space-y-3 pt-3">
                {node.children!.map((child, i) => (
                  <TreeNode key={`${child.label}-${i}`} node={child} depth={depth + 1} viewMode={viewMode} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}