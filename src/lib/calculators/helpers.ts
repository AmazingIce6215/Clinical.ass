import type {
  CalculatorResult,
  CalculatorValue,
  CalculatorValues,
  FieldOption,
} from "./types";

type Severity = CalculatorResult["severity"];

export function asNumber(value: CalculatorValue | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  throw new Error("A numeric input is missing or invalid.");
}

export function asBoolean(value: CalculatorValue | undefined): boolean {
  return Boolean(value);
}

export function sumBooleanFields(values: CalculatorValues, ids: string[]): number {
  return ids.reduce((sum, id) => sum + (asBoolean(values[id]) ? 1 : 0), 0);
}

export function sumSelectPoints(
  values: CalculatorValues,
  fields: { id: string; options?: FieldOption[] }[],
): number {
  return fields.reduce((sum, field) => {
    const raw = values[field.id];
    if (raw === "" || raw === undefined || raw === null) return sum;
    const option = field.options?.find((item) => String(item.value) === String(raw));
    if (option) return sum + option.points;
    const n = Number(raw);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export function roundTo(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function formulaResult(params: {
  value: number;
  unit?: string;
  digits?: number;
  label: string;
  severity?: Severity;
  interpretation: string;
  clinicalSignificance: string;
  limitations: string;
  details?: CalculatorResult["details"];
  recommendations?: string[];
  /** Display denominator for formula tools (default 0 = value-only UI). */
  maxScore?: number;
}): CalculatorResult {
  const primary = roundTo(params.value, params.digits ?? 1);
  return {
    kind: "formula",
    score: primary,
    maxScore: params.maxScore ?? 0,
    primaryValue: primary,
    unit: params.unit,
    label: params.label,
    severity: params.severity ?? "low",
    interpretation: params.interpretation,
    clinicalSignificance: params.clinicalSignificance,
    limitations: params.limitations,
    details: params.details,
    recommendations: params.recommendations,
  };
}

export function scoreResult(params: {
  score: number;
  maxScore: number;
  label: string;
  severity: Severity;
  interpretation: string;
  clinicalSignificance: string;
  limitations: string;
  details?: CalculatorResult["details"];
  recommendations?: string[];
}): CalculatorResult {
  return {
    kind: "score",
    ...params,
  };
}

export function bandSeverity(
  score: number,
  bands: { max: number; severity: Severity; label: string }[],
): { severity: Severity; label: string } {
  for (const band of bands) {
    if (score <= band.max) return { severity: band.severity, label: band.label };
  }
  const last = bands[bands.length - 1];
  return { severity: last.severity, label: last.label };
}
