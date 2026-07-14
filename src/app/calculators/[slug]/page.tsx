import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CalculatorEvidencePanel } from "@/components/calculators/calculator-evidence";
import { CalculatorIcon } from "@/components/calculators/calculator-icon";
import { CalculatorWorkspace } from "@/components/calculators/calculator-workspace";
import {
  formatCalculatorCategory,
  getAllCalculators,
  getCalculator,
} from "@/lib/calculators/registry";

interface CalculatorPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCalculators().map((calculator) => ({ slug: calculator.slug }));
}

export async function generateMetadata({ params }: CalculatorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const calculator = getCalculator(slug);

  if (!calculator) return {};

  return {
    title: `${calculator.shortName} calculator`,
    description: calculator.description,
  };
}

export default async function CalculatorPage({ params }: CalculatorPageProps) {
  const { slug } = await params;
  const calculator = getCalculator(slug);

  if (!calculator) notFound();

  return (
    <AppShell
      backHref="/calculators"
      title={calculator.shortName}
      subtitle="Clinical calculator"
    >
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-accent">
              <CalculatorIcon name={calculator.icon} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  {formatCalculatorCategory(calculator.category)}
                </p>
                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted">
                  {calculator.shortName}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {calculator.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">
                {calculator.description}
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-3 rounded-lg border border-border bg-background p-3 text-xs leading-5 text-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <p>
              Educational tool only. Verify all inputs and interpret the result alongside current
              local guidance and the complete clinical assessment.
            </p>
          </div>
        </header>

        <CalculatorWorkspace key={calculator.slug} slug={calculator.slug} />
        <CalculatorEvidencePanel evidence={calculator.evidence} />
      </div>
    </AppShell>
  );
}
