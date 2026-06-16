export type FieldType = "number" | "select" | "boolean" | "multiselect";

export interface FieldOption {
  label: string;
  value: string | number;
  points: number;
}

export interface CalculatorField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  suffix?: string;
  options?: FieldOption[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  pointsMap?: Record<string, number>;
}

export interface CalculatorResult {
  score: number;
  maxScore: number;
  label: string;
  severity: "low" | "moderate" | "high" | "severe" | "critical";
  interpretation: string;
  clinicalSignificance: string;
  limitations: string;
  details?: { label: string; value: string }[];
}

export interface CalculatorDefinition {
  slug: string;
  title: string;
  shortName: string;
  description: string;
  category: string;
  icon: string;
  clinicalApplication: string;
  inputs: CalculatorField[];
  calculate: (values: Record<string, string | number | boolean | string[]>) => CalculatorResult;
}
