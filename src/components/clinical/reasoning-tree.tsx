"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { ReasoningNode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReasoningTreeView({ tree }: { tree: ReasoningNode }) {
  const [viewMode, setViewMode] = useState<"simple" | "deep">("deep");

  return (
    <div className="rounded-2xl border border-border/70 bg-surface/80 p-6 shadow-soft backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
          Clinical Reasoning Tree
        </h3>
        <div className="flex gap-1 rounded-lg border border-border/50 bg-surface/50 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("simple")}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition",
              viewMode === "simple"
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            Simple
          </button>
          <button
            type="button"
            onClick={() => setViewMode("deep")}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition",
              viewMode === "deep"
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            Deep reasoning
          </button>
        </div>
      </div>

      <TreeNode node={tree} depth={0} viewMode={viewMode} />
    </div>
  );
}

function TreeNode({
  node,
  depth,
  viewMode,
}: {
  node: ReasoningNode;
  depth: number;
  viewMode: "simple" | "deep";
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isFinal = node.type === "final";

  // In simple mode, only show symptom, pathway, final
  if (viewMode === "simple" && node.type === "elimination" && depth > 1) return null;
  if (viewMode === "simple" && node.type === "diagnosis" && depth > 1) return null;

  const nodeStyles = {
    symptom: "border-l-accent/30 bg-accent/5",
    pathway: "border-l-blue-400/30 bg-blue-50/40 dark:bg-blue-950/20",
    diagnosis: "border-l-amber-400/30 bg-amber-50/40 dark:bg-amber-950/20",
    elimination: "border-l-slate-400/30 bg-slate-50/40 dark:bg-slate-900/30",
    final: "border-l-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/30",
  };

  const labelStyles = {
    symptom: "text-accent font-semibold",
    pathway: "text-blue-700 dark:text-blue-300 font-medium",
    diagnosis: "text-amber-800 dark:text-amber-200 font-medium",
    elimination: "text-slate-600 dark:text-slate-400 font-medium",
    final: "text-emerald-800 dark:text-emerald-200 font-bold",
  };

  const indent = depth * 20;

  return (
    <div className="relative">
      <div
        className={cn(
          "relative rounded-xl border p-3 transition",
          nodeStyles[node.type],
          isFinal && "ring-1 ring-emerald-400/40",
        )}
        style={{ marginLeft: indent }}
      >
        <div className="flex items-start gap-2">
          {hasChildren && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border/60 bg-surface/80 text-[10px] text-muted transition hover:border-accent/40 hover:text-accent"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? "−" : "+"}
            </button>
          )}
          {!hasChildren && <div className="mt-0.5 h-5 w-5 shrink-0" />}

          <div className="min-w-0 flex-1">
            <p className={cn("text-sm leading-snug", labelStyles[node.type])}>
              {node.type === "elimination" && "✕ "}
              {node.type === "diagnosis" && "▸ "}
              {node.type === "final" && "◆ "}
              {node.type === "pathway" && "▣ "}
              {node.label}
            </p>

            {node.reasoning && depth < 3 && viewMode === "deep" && (
              <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-muted">
                {node.reasoning}
              </p>
            )}

            {node.supporting && node.supporting.length > 0 && viewMode === "deep" && (
              <div className="mt-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Supporting
                </p>
                <ul className="mt-0.5 space-y-0.5">
                  {node.supporting.map((s) => (
                    <li key={s} className="flex gap-1.5 text-[11px] text-muted">
                      <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {node.against && node.against.length > 0 && viewMode === "deep" && (
              <div className="mt-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-red-500 dark:text-red-400">
                  Against
                </p>
                <ul className="mt-0.5 space-y-0.5">
                  {node.against.map((a) => (
                    <li key={a} className="flex gap-1.5 text-[11px] text-muted">
                      <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden pt-2"
          >
            {/* Vertical connector line */}
            <div
              className="absolute left-[calc(20px_+_12px)] top-12 w-px bg-border/60"
              style={{ height: `calc(100% - 48px)` }}
            />

            {node.children!.map((child, i) => (
              <TreeNode key={`${child.label}-${i}`} node={child} depth={depth + 1} viewMode={viewMode} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}