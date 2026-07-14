"use client";

import { Calculator as CalculatorGlyph } from "lucide-react";
import type {
  CalculatorDefinition,
  CalculatorField,
  CalculatorValue,
} from "@/lib/calculators/types";

interface CalculatorFormProps {
  calculator: CalculatorDefinition;
  values: Record<string, CalculatorValue>;
  onFieldChange: (id: string, value: CalculatorValue) => void;
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
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
      aria-label={`${calculator.title} inputs`}
    >
      {calculator.inputs.map((field) => (
        <FieldInput
          key={field.id}
          calculatorSlug={calculator.slug}
          field={field}
          value={values[field.id]}
          onChange={(value) => onFieldChange(field.id, value)}
        />
      ))}

      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground outline-none transition-colors hover:brightness-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none"
      >
        <CalculatorGlyph className="size-4" aria-hidden="true" />
        {hasResult ? "Recalculate score" : "Calculate score"}
      </button>
    </form>
  );
}

function FieldInput({
  calculatorSlug,
  field,
  value,
  onChange,
}: {
  calculatorSlug: string;
  field: CalculatorField;
  value: CalculatorValue | undefined;
  onChange: (value: CalculatorValue) => void;
}) {
  const inputId = `calculator-${calculatorSlug}-${field.id}`;
  const helpId = field.helpText ? `${inputId}-help` : undefined;

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {field.label}
        </label>
        {field.helpText ? (
          <p id={helpId} className="text-xs leading-5 text-muted">
            {field.helpText}
          </p>
        ) : null}
        <select
          id={inputId}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={helpId}
          aria-required={field.required !== false}
          className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 motion-reduce:transition-none"
        >
          <option value="" disabled>
            Select an option
          </option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <label
        htmlFor={inputId}
        className="grid min-h-11 cursor-pointer grid-cols-[1.25rem_1fr] items-start gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-accent/50 motion-reduce:transition-none"
      >
        <input
          id={inputId}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={helpId}
          className="mt-0.5 size-5 rounded border-border accent-accent"
        />
        <span>
          <span className="block text-sm font-medium leading-5 text-foreground">{field.label}</span>
          {field.helpText ? (
            <span id={helpId} className="mt-1 block text-xs leading-5 text-muted">
              {field.helpText}
            </span>
          ) : null}
        </span>
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {field.label}
        </label>
        {field.helpText ? (
          <p id={helpId} className="text-xs leading-5 text-muted">
            {field.helpText}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type="number"
            value={typeof value === "number" || typeof value === "string" ? value : ""}
            onChange={(event) =>
              onChange(event.target.value === "" ? "" : Number(event.target.value))
            }
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            aria-describedby={helpId}
            aria-required={field.required !== false}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 motion-reduce:transition-none"
          />
          {field.suffix ? <span className="shrink-0 text-xs text-muted">{field.suffix}</span> : null}
        </div>
      </div>
    );
  }

  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <fieldset className="rounded-lg border border-border bg-background p-3">
      <legend className="px-1 text-sm font-medium text-foreground">{field.label}</legend>
      {field.helpText ? <p className="mb-2 text-xs leading-5 text-muted">{field.helpText}</p> : null}
      <div className="space-y-2">
        {field.options?.map((option) => {
          const optionValue = String(option.value);
          const optionId = `${inputId}-${optionValue.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
          const checked = selectedValues.includes(optionValue);

          return (
            <label key={optionValue} htmlFor={optionId} className="flex min-h-11 items-center gap-3 text-sm">
              <input
                id={optionId}
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(
                    checked
                      ? selectedValues.filter((item) => item !== optionValue)
                      : [...selectedValues, optionValue],
                  )
                }
                className="size-5 rounded border-border accent-accent"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
