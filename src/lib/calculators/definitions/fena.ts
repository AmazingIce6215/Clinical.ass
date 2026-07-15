import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const fena: CalculatorDefinition = {
  slug: "fractional-excretion-sodium",
  title: "Fractional Excretion of Sodium (FeNa)",
  shortName: "FeNa",
  description:
    "Estimates the percentage of filtered sodium excreted in urine to support AKI work-up teaching.",
  category: "nephrology",
  icon: "kidney",
  clinicalApplication:
    "Educational adjunct distinguishing pre-renal from intrinsic AKI patterns—never in isolation.",
  evidence: {
    version: "FeNa (%) = (UNa × PCr) / (PNa × UCr) × 100",
    intendedPopulation: "Adults with acute kidney injury and paired serum/urine chemistries.",
    exclusions: [
      "Patients on diuretics (FeUrea often preferred)",
      "CKD with baseline low GFR where interpretation differs",
      "Contrast exposure and other settings that distort sodium handling",
    ],
    references: [
      {
        title: "Urinary diagnostic indices in acute renal failure",
        citation: "Espinel CH. JAMA. 1976;236(6):579–581.",
        url: "https://pubmed.ncbi.nlm.nih.gov/947239/",
      },
      {
        title: "Diagnostic value of FeNa",
        citation: "Miller TR, et al. Ann Intern Med. 1978;89(1):47–50.",
        url: "https://pubmed.ncbi.nlm.nih.gov/666184/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "una", label: "Urine Na", type: "number", suffix: "mmol/L", min: 1, max: 300, step: 0.1 },
    { id: "pna", label: "Plasma Na", type: "number", suffix: "mmol/L", min: 100, max: 180, step: 0.1 },
    { id: "ucr", label: "Urine creatinine", type: "number", suffix: "µmol/L or mg/dL (same unit as plasma)", min: 0.1, max: 50000, step: 0.1 },
    { id: "pcr", label: "Plasma creatinine", type: "number", suffix: "same unit as urine Cr", min: 0.1, max: 2000, step: 0.1 },
  ],
  calculate: (values) => {
    const una = asNumber(values.una);
    const pna = asNumber(values.pna);
    const ucr = asNumber(values.ucr);
    const pcr = asNumber(values.pcr);
    if (pna <= 0 || ucr <= 0) throw new Error("Plasma Na and urine creatinine must be greater than zero.");
    const fenaValue = ((una * pcr) / (pna * ucr)) * 100;

    let severity: "low" | "moderate" | "high" = "low";
    let label = "FeNa intermediate / indeterminate band";
    if (fenaValue < 1) {
      label = "FeNa < 1% — often discussed as pre-renal pattern";
      severity = "moderate";
    } else if (fenaValue > 2) {
      label = "FeNa > 2% — often discussed as intrinsic pattern";
      severity = "high";
    }

    return formulaResult({
      value: fenaValue,
      unit: "%",
      digits: 2,
      label,
      severity,
      interpretation: `FeNa ${roundTo(fenaValue, 2)}%.`,
      clinicalSignificance:
        "Classic teaching uses <1% for pre-renal and >2% for ATN-type patterns, with substantial overlap and many exceptions.",
      limitations:
        "Unreliable with diuretics, CKD, contrast, and mixed shock. Clinical volume assessment remains essential.",
      details: [
        { label: "UNa", value: `${una}` },
        { label: "PNa", value: `${pna}` },
        { label: "UCr", value: `${ucr}` },
        { label: "PCr", value: `${pcr}` },
        { label: "FeNa", value: `${roundTo(fenaValue, 2)}%` },
      ],
      recommendations: [
        "Integrate with history, examination, urine microscopy, and trend in creatinine.",
        "Consider FeUrea when diuretics have been given.",
      ],
    });
  },
};
