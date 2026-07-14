import { BookOpen, CircleSlash2, ExternalLink, Users } from "lucide-react";
import type { CalculatorEvidence } from "@/lib/calculators/types";

export function CalculatorEvidencePanel({ evidence }: { evidence: CalculatorEvidence }) {
  return (
    <section
      className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"
      aria-labelledby="calculator-evidence-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Source notes</p>
          <h2 id="calculator-evidence-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            Evidence and scope
          </h2>
        </div>
        <div className="text-right text-xs text-muted">
          <p className="font-medium text-foreground">{evidence.version}</p>
          <p className="mt-1">
            Reviewed <time dateTime={evidence.reviewedAt}>{evidence.reviewedAt}</time>
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="size-4 text-accent" aria-hidden="true" />
            Intended population
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted">{evidence.intendedPopulation}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CircleSlash2 className="size-4 text-accent" aria-hidden="true" />
            Exclusions and cautions
          </h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
            {evidence.exclusions.map((exclusion) => (
              <li key={exclusion} className="flex gap-2">
                <span aria-hidden="true">—</span>
                <span>{exclusion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BookOpen className="size-4 text-accent" aria-hidden="true" />
          Authoritative references
        </h3>
        <ol className="mt-2 divide-y divide-border rounded-lg border border-border bg-background px-4">
          {evidence.references.map((reference) => (
            <li key={reference.url} className="py-3">
              <a
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-start gap-2 rounded-sm text-sm font-semibold leading-5 text-foreground outline-none hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span>{reference.title}</span>
                <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted group-hover:text-accent" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <p className="mt-1 text-xs leading-5 text-muted">{reference.citation}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
