"use client";

import type { CalculatorDefinition, CalculatorField } from "@/lib/calculators/types";
import { PrimaryButton } from "@/components/app-shell";

interface CalculatorFormProps {
  calculator: CalculatorDefinition;
  values: Record<string, string | number | boolean | string[]>;
  onFieldChange: (id: string, value: string | number | boolean | string[]) => void;
  onSubmit: () => void;
  hasResult: boolean;
}

export function CalculatorForm({
  calculator,
  values,
  onFieldChange,
  onSubmit,
  hasResult,
}: CalculatorFormProps) {
  return (
    <div className="space-y-5">
      {calculator.inputs.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={(v) => onFieldChange(field.id, v)}
        />
      ))}
      <PrimaryButton onClick={onSubmit} className="w-full">
        {hasResult ? "Recalculate" : "Calculate Score"}
      </PrimaryButton>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CalculatorField;
  value: unknown;
  onChange: (v: string | number | boolean) => void;
}) {
  if (field.type === "select") {
    return (
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">{field.label}</span>
        {field.helpText && (
          <p className="text-xs text-muted/70">{field.helpText}</p>
        )}
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
        >
          <option value="" disabled>
            Select...
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-surface/60 px-4 py-3 transition hover:border-accent/30">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border/80 text-accent accent-accent"
        />
        <div className="space-y-0.5">
          <span className="block text-sm font-medium text-foreground">{field.label}</span>
          {field.helpText && (
            <span className="block text-xs text-muted/70">{field.helpText}</span>
          )}
        </div>
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">{field.label}</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={String(value ?? "")}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
          />
          {field.suffix && (
            <span className="shrink-0 text-xs text-muted">{field.suffix}</span>
          )}
        </div>
      </label>
    );
  }

  return null;
}
