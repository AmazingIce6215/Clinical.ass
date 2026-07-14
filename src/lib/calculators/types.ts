export type FieldType = "number" | "select" | "boolean" | "multiselect";

export type CalculatorCategory =
  | "cardiology"
  | "critical-care"
  | "hepatology"
  | "neurology"
  | "obstetrics"
  | "respiratory";

export type CalculatorIconKey =
  | "activity"
  | "air-vent"
  | "baby"
  | "brain"
  | "droplets"
  | "shield-alert"
  | "stethoscope";

export type ISODate = `${number}-${number}-${number}`;

export type CalculatorValue = string | number | boolean | string[];
export type CalculatorValues = Record<string, CalculatorValue>;

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
  recommendations?: string[];
}

export interface CalculatorReference {
  title: string;
  citation: string;
  url: string;
}

export interface CalculatorEvidence {
  version: string;
  intendedPopulation: string;
  exclusions: string[];
  references: CalculatorReference[];
  reviewedAt: ISODate;
}

export interface CalculatorDefinition {
  slug: string;
  title: string;
  shortName: string;
  description: string;
  category: CalculatorCategory;
  icon: CalculatorIconKey;
  clinicalApplication: string;
  evidence: CalculatorEvidence;
  inputs: CalculatorField[];
  calculate: (values: CalculatorValues) => CalculatorResult;
}
