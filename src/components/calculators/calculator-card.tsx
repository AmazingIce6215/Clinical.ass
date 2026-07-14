"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { CalculatorIcon } from "@/components/calculators/calculator-icon";
import { formatCalculatorCategory } from "@/lib/calculators/registry";
import type { CalculatorDefinition } from "@/lib/calculators/types";
import { cn } from "@/lib/utils";

interface CalculatorCardProps {
  calculator: CalculatorDefinition;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
}

export function CalculatorCard({
  calculator,
  isFavorite,
  onToggleFavorite,
}: CalculatorCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-accent">
            <CalculatorIcon name={calculator.icon} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {formatCalculatorCategory(calculator.category)}
            </p>
            <p className="mt-0.5 text-sm font-medium text-muted">{calculator.shortName}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(calculator.slug)}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors motion-reduce:transition-none",
            isFavorite
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-background text-muted hover:border-accent/50 hover:text-foreground",
          )}
          aria-label={isFavorite ? `Remove ${calculator.title} from saved calculators` : `Save ${calculator.title}`}
          aria-pressed={isFavorite}
        >
          <Star className="size-4" fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
          <span className="hidden sm:inline">{isFavorite ? "Saved" : "Save"}</span>
        </button>
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          <Link
            href={`/calculators/${calculator.slug}`}
            className="rounded-sm outline-none hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {calculator.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
          {calculator.description}
        </p>

        <Link
          href={`/calculators/${calculator.slug}`}
          className="mt-5 inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-semibold text-accent outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none"
          aria-label={`Open ${calculator.title}`}
        >
          Open calculator
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
