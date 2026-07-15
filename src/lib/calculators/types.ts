export type FieldType = "number" | "select" | "boolean" | "multiselect";

export type CalculatorCategory =
  | "cardiology"
  | "critical-care"
  | "emergency"
  | "endocrinology"
  | "gastroenterology"
  | "general"
  | "geriatrics"
  | "hematology"
  | "hepatology"
  | "infectious-disease"
  | "mental-health"
  | "nephrology"
  | "neurology"
  | "obstetrics"
  | "pediatrics"
  | "pulmonology"
  | "respiratory"
  | "rheumatology"
  | "surgery"
  | "trauma";

export type CalculatorIconKey =
  | "activity"
  | "air-vent"
  | "baby"
  | "bone"
  | "brain"
  | "droplets"
  | "flask-conical"
  | "heart-pulse"
  | "hospital"
  | "kidney"
  | "pill"
  | "scale"
  | "shield-alert"
  | "stethoscope"
  | "syringe"
  | "thermometer";

export type ISODate = `${number}-${number}-${number}`;

export type CalculatorValue = string | number | boolean | string[];
export type CalculatorValues = Record<string, CalculatorValue>;

export type CalculatorResultKind = "score" | "formula";

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
  /** Defaults to "score" when omitted. */
  kind?: CalculatorResultKind;
  score: number;
  maxScore: number;
  /** For formula calculators: primary computed value (may equal score). */
  primaryValue?: number | string;
  unit?: string;
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

export type CatalogStatus = "shipped" | "planned" | "deferred";

export interface CatalogEntry {
  /** Stable Orizon slug once shipped; provisional slug while planned. */
  slug: string;
  title: string;
  /** External checklist ID from public Medscape index (coverage only, not content source). */
  externalId?: number;
  status: CatalogStatus;
  reason?: string;
}
