"use client";

import { useCallback, useState } from "react";
import { Info } from "lucide-react";
import { CalculatorForm } from "@/components/calculators/calculator-form";
import { CalculatorIcon } from "@/components/calculators/calculator-icon";
import { CalculatorResultDisplay } from "@/components/calculators/calculator-result";
import { getCalculator } from "@/lib/calculators/registry";
import type {
  CalculatorDefinition,
  CalculatorResult,
  CalculatorValue,
  CalculatorValues,
} from "@/lib/calculators/types";

export function buildCalculatorDefaults(calculator: CalculatorDefinition): CalculatorValues {
  return Object.fromEntries(
    calculator.inputs.map((input) => {
      if (input.type === "boolean") return [input.id, false];
      if (input.type === "multiselect") return [input.id, []];
      return [input.id, ""];
    }),
  );
}

export function CalculatorWorkspace({ slug }: { slug: string }) {
  const calculator = getCalculator(slug);

  if (!calculator) return null;

  return <CalculatorWorkspaceContent calculator={calculator} />;
}

function CalculatorWorkspaceContent({ calculator }: { calculator: CalculatorDefinition }) {
  const [values, setValues] = useState<CalculatorValues>(() => buildCalculatorDefaults(calculator));
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = useCallback((id: string, value: CalculatorValue) => {
    setValues((current) => ({ ...current, [id]: value }));
    setResult(null);
    setError(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (
      calculator.slug === "cha2ds2-vasc" &&
      Boolean(values.age_75) &&
      Boolean(values.age_65)
    ) {
      setError("Select only one age band: age 65–74 years or age 75 years and over.");
      return;
    }

    const missing = calculator.inputs.filter((input) => {
      if (input.type === "boolean") return false;
      if (input.required === false) return false;
      const value = values[input.id];
      if (Array.isArray(value)) return value.length === 0;
      return value === "" || value === undefined || value === null;
    });

    if (missing.length > 0) {
      setError(`Complete the following fields: ${missing.map((input) => input.label).join(", ")}.`);
      return;
    }

    try {
      setResult(calculator.calculate(values));
      setError(null);
    } catch {
      setResult(null);
      setError("The score could not be calculated. Review the entered values and try again.");
    }
  }, [calculator, values]);

  const handleReset = useCallback(() => {
    setValues(buildCalculatorDefaults(calculator));
    setResult(null);
    setError(null);
  }, [calculator]);

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
      <section
        className="rounded-xl border border-border bg-surface p-5 shadow-sm lg:col-span-5 sm:p-6"
        aria-labelledby="calculator-inputs-heading"
      >
        <div className="border-b border-border pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Patient variables</p>
          <h2 id="calculator-inputs-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            Enter score inputs
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">{calculator.clinicalApplication}</p>
        </div>

        {error ? (
          <div
            className="mt-4 flex gap-3 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm leading-6 text-danger"
            role="alert"
          >
            <Info className="mt-1 size-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="mt-5">
          <CalculatorForm
            calculator={calculator}
            values={values}
            onFieldChange={handleFieldChange}
            onSubmit={handleSubmit}
            hasResult={result !== null}
          />
        </div>
      </section>

      <div className="lg:col-span-7">
        {result ? (
          <CalculatorResultDisplay result={result} onReset={handleReset} />
        ) : (
          <section
            className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 text-center shadow-sm"
            aria-labelledby="calculator-result-heading"
          >
            <span className="flex size-12 items-center justify-center rounded-lg border border-border bg-background text-accent">
              <CalculatorIcon name={calculator.icon} className="size-6" />
            </span>
            <h2 id="calculator-result-heading" className="mt-4 text-lg font-semibold text-foreground">
              No score calculated
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              Complete the patient variables, then calculate to view the score, interpretation,
              limitations, and component breakdown.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
