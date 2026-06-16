"use client";

import type { CalculatorResult } from "@/lib/calculators/types";
import { GlassCard } from "@/components/app-shell";
import { cn } from "@/lib/utils";

interface CalculatorResultProps {
  result: CalculatorResult;
  onReset: () => void;
}

const severityConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  low: { bg: "from-emerald-500/10 to-emerald-400/5", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", label: "Low risk" },
  moderate: { bg: "from-amber-500/10 to-amber-400/5", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400", label: "Moderate risk" },
  high: { bg: "from-orange-500/10 to-orange-400/5", border: "border-orange-500/30", text: "text-orange-600 dark:text-orange-400", label: "High risk" },
  severe: { bg: "from-red-500/15 to-red-400/5", border: "border-red-500/30", text: "text-red-600 dark:text-red-400", label: "Severe" },
  critical: { bg: "from-purple-600/15 to-red-500/10", border: "border-purple-500/40", text: "text-purple-600 dark:text-purple-400", label: "Critical" },
};

export function CalculatorResultDisplay({ result, onReset }: CalculatorResultProps) {
  const config = severityConfig[result.severity] ?? severityConfig.moderate;

  return (
    <GlassCard className={cn("overflow-hidden", config.border)}>
      <div className="space-y-5">
        <div className={cn("rounded-2xl bg-gradient-to-br p-5 text-center", config.bg)}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Score
          </p>
          <p className={cn("mt-1 text-5xl font-bold tracking-tight", config.text)}>
            {result.score}
            <span className="text-lg font-medium text-muted">/{result.maxScore}</span>
          </p>
          <div className="mt-2">
            <span
              className={cn(
                "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                config.bg,
                config.text,
              )}
            >
              {result.label}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Section title="Interpretation" content={result.interpretation} />
          <Section title="Clinical Significance" content={result.clinicalSignificance} />
          <Section title="Limitations" content={result.limitations} />

          {result.details && result.details.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                Component Breakdown
              </p>
              <div className="space-y-1">
                {result.details.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-surface/50 px-3 py-2"
                  >
                    <span className="text-xs text-foreground">{d.label}</span>
                    <span className="text-xs font-medium text-muted">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-border/70 bg-surface/60 py-2.5 text-sm font-medium text-muted transition hover:border-accent/30 hover:text-accent"
        >
          Start over
        </button>
      </div>
    </GlassCard>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      <p className="text-sm leading-relaxed text-foreground/90">{content}</p>
    </div>
  );
}
