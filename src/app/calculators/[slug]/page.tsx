"use client";

import { use, useCallback, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell, GlassCard } from "@/components/app-shell";
import { CalculatorForm } from "@/components/calculators/calculator-form";
import { CalculatorResultDisplay } from "@/components/calculators/calculator-result";
import { getCalculator } from "@/lib/calculators/registry";
import type { CalculatorResult } from "@/lib/calculators/types";
import { cn } from "@/lib/utils";

const defaultValues: Record<string, string | number | boolean | string[]> = {};

function buildDefaults(calc: ReturnType<typeof getCalculator>) {
  if (!calc) return {};
  const vals: Record<string, string | number | boolean | string[]> = {};
  for (const input of calc.inputs) {
    if (input.type === "boolean") vals[input.id] = false;
    else if (input.type === "number") vals[input.id] = 0;
    else if (input.type === "select") vals[input.id] = "";
    else vals[input.id] = [];
  }
  return vals;
}

export default function CalculatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const calculator = useMemo(() => getCalculator(slug), [slug]);

  const [values, setValues] = useState<Record<string, string | number | boolean | string[]>>({});
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  const initialized = useMemo(() => {
    if (!calculator) return false;
    const defaults = buildDefaults(calculator);
    setValues(defaults);
    setResult(null);
    setError(null);
    setHasCalculated(false);
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleFieldChange = useCallback(
    (id: string, value: string | number | boolean | string[]) => {
      setValues((prev) => ({ ...prev, [id]: value }));
      setResult(null);
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!calculator) return;
    setError(null);

    const missing = calculator.inputs.filter(
      (i) => {
        const v = values[i.id];
        return v === "" || v === undefined || v === null;
      },
    );

    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }

    try {
      const res = calculator.calculate(values);
      setResult(res);
      setHasCalculated(true);
    } catch {
      setError("Calculation error. Check your inputs.");
    }
  }, [calculator, values]);

  const handleReset = useCallback(() => {
    setResult(null);
    setHasCalculated(false);
    const defaults = buildDefaults(calculator);
    setValues(defaults);
    setError(null);
  }, [calculator]);

  if (!calculator) {
    notFound();
  }

  return (
    <AppShell
      backHref="/calculators"
      title={calculator.shortName}
      subtitle={calculator.title}
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-surface/60 px-4 py-2 text-sm">
            <span className="text-xl">{calculator.icon}</span>
            <span>
              <span className="font-medium text-foreground">{calculator.title}</span>
              <span className="ml-2 rounded-full border border-border/60 px-2 py-0.5 text-[11px] capitalize text-muted">
                {calculator.category}
              </span>
            </span>
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className={cn("lg:col-span-2", hasCalculated && "lg:col-span-5 lg:grid lg:grid-cols-5 lg:gap-6")}>
            <div className={hasCalculated ? "lg:col-span-2" : ""}>
              <GlassCard>
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  Inputs
                </h2>
                <p className="mb-4 text-xs leading-relaxed text-muted/70">
                  {calculator.clinicalApplication}
                </p>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <CalculatorForm
                  calculator={calculator}
                  values={values}
                  onFieldChange={handleFieldChange}
                  onSubmit={handleSubmit}
                  hasResult={hasCalculated}
                />
              </GlassCard>
            </div>
          </div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CalculatorResultDisplay result={result} onReset={handleReset} />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-5xl mb-4">{calculator.icon}</span>
                    <h3 className="text-lg font-semibold text-foreground">{calculator.title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                      {calculator.description}
                    </p>
                    <p className="mt-4 text-xs text-muted/60">
                      Enter values on the left, then tap Calculate.
                    </p>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
