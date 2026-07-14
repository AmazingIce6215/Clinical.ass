"use client";

import { Check, Info, RotateCcw } from "lucide-react";
import type { CalculatorResult } from "@/lib/calculators/types";
import { cn } from "@/lib/utils";

interface CalculatorResultProps {
  result: CalculatorResult;
  onReset: () => void;
}

const severityConfig: Record<
  CalculatorResult["severity"],
  { border: string; surface: string; text: string }
> = {
  low: {
    border: "border-brand/25",
    surface: "bg-brand-soft",
    text: "text-brand-strong",
  },
  moderate: {
    border: "border-warning/30",
    surface: "bg-warning-soft",
    text: "text-warning",
  },
  high: {
    border: "border-danger/25",
    surface: "bg-danger-soft",
    text: "text-danger",
  },
  severe: {
    border: "border-danger/30",
    surface: "bg-danger-soft",
    text: "text-danger",
  },
  critical: {
    border: "border-danger/40",
    surface: "bg-danger-soft",
    text: "text-danger",
  },
};

export function CalculatorResultDisplay({ result, onReset }: CalculatorResultProps) {
  const config = severityConfig[result.severity];

  return (
    <section
      className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"
      aria-labelledby="calculator-result-heading"
    >
      <div
        className={cn("rounded-lg border p-5", config.border, config.surface)}
        role="status"
        aria-live="polite"
      >
        <h2 id="calculator-result-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Calculated score
        </h2>
        <output
          className={cn("mt-2 block font-mono text-4xl font-semibold tracking-tight", config.text)}
          aria-label={`Calculated score ${result.score} out of ${result.maxScore}`}
        >
          {result.score}
          <span className="ml-1 text-base font-medium text-muted">/ {result.maxScore}</span>
        </output>
        <p className={cn("mt-3 text-sm font-semibold", config.text)}>{result.label}</p>
      </div>

      <div className="mt-6 space-y-5">
        <ResultSection title="Interpretation" content={result.interpretation} />
        <ResultSection title="Clinical context" content={result.clinicalSignificance} />

        {result.recommendations?.length ? (
          <section aria-labelledby="calculator-considerations-heading">
            <h3
              id="calculator-considerations-heading"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-muted"
            >
              Considerations for clinical review
            </h3>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-background px-3">
              {result.recommendations.map((recommendation) => (
                <li key={recommendation} className="flex gap-3 py-3 text-sm leading-6 text-foreground">
                  <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <ResultSection title="Limitations and context" content={result.limitations} />

        {result.details?.length ? (
          <section aria-labelledby="calculator-breakdown-heading">
            <h3
              id="calculator-breakdown-heading"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-muted"
            >
              Component breakdown
            </h3>
            <dl className="mt-2 divide-y divide-border rounded-lg border border-border bg-background px-3">
              {result.details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-sm text-foreground">{detail.label}</dt>
                  <dd className="shrink-0 text-sm font-medium tabular-nums text-muted">{detail.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>

      <div className="mt-6 flex gap-3 rounded-lg border border-border bg-background p-3 text-xs leading-5 text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
        <p>
          Educational interpretation only. Confirm inputs and apply current local guidance, the full
          clinical picture, and senior review where appropriate.
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-colors hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Clear result and start again
      </button>
    </section>
  );
}

function ResultSection({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-foreground">{content}</p>
    </section>
  );
}
