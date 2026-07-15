import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const discriminantFunction: CalculatorDefinition = {
  slug: "maddrey-discriminant-function",
  title: "Maddrey Discriminant Function (Alcoholic Hepatitis)",
  shortName: "mDF",
  description:
    "Estimates severity of alcoholic hepatitis using PT/INR prolongation and bilirubin.",
  category: "hepatology",
  icon: "stethoscope",
  clinicalApplication:
    "Educational severity marker in alcoholic hepatitis for steroid consideration discussions.",
  evidence: {
    version: "Maddrey DF = 4.6 × (PT_patient − PT_control) + bilirubin(mg/dL)",
    intendedPopulation: "Adults with clinical alcoholic hepatitis.",
    exclusions: [
      "Alternative diagnoses (biliary obstruction, ischaemic hepatitis) not excluded",
      "Use without hepatology guidance for immunosuppression decisions",
    ],
    references: [
      {
        title: "Corticosteroid therapy of alcoholic hepatitis",
        citation: "Maddrey WC, et al. Gastroenterology. 1978;75(2):193–199.",
        url: "https://pubmed.ncbi.nlm.nih.gov/352788/",
      },
      {
        title: "AASLD alcoholic liver disease guidance",
        citation: "Crabb DW, et al. Hepatology. 2020;71(1):306–333.",
        url: "https://pubmed.ncbi.nlm.nih.gov/31314133/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "pt_patient",
      label: "Patient PT",
      type: "number",
      suffix: "seconds",
      min: 8,
      max: 100,
      step: 0.1,
    },
    {
      id: "pt_control",
      label: "Control / lab mean PT",
      type: "number",
      suffix: "seconds",
      min: 8,
      max: 20,
      step: 0.1,
      helpText: "Often ~11–12 s; use local control.",
    },
    {
      id: "bilirubin",
      label: "Bilirubin",
      type: "number",
      suffix: "mg/dL",
      min: 0.1,
      max: 50,
      step: 0.1,
      helpText: "mg/dL (µmol/L ÷ 17.1).",
    },
  ],
  calculate: (values) => {
    const ptP = asNumber(values.pt_patient);
    const ptC = asNumber(values.pt_control);
    const bili = asNumber(values.bilirubin);
    const value = 4.6 * (ptP - ptC) + bili;
    const severe = value >= 32;
    return formulaResult({
      value,
      digits: 1,
      label: severe
        ? "Severe alcoholic hepatitis band (DF ≥ 32)"
        : "Lower DF band (< 32)",
      severity: severe ? "high" : "moderate",
      interpretation: `Maddrey DF ${roundTo(value, 1)}.`,
      clinicalSignificance:
        "DF ≥32 identifies patients historically considered for corticosteroid therapy after infection exclusion, alongside MELD and Lille models.",
      limitations:
        "PT control values vary by lab. MELD is increasingly preferred for prognosis.",
      details: [
        { label: "Patient PT", value: `${ptP} s` },
        { label: "Control PT", value: `${ptC} s` },
        { label: "Bilirubin", value: `${bili} mg/dL` },
        { label: "DF", value: `${roundTo(value, 1)}` },
      ],
      recommendations: [
        "Ensure alcohol cessation support and nutrition.",
        "Discuss steroids/pentoxifylline only with hepatology after ruling out infection.",
      ],
    });
  },
};
