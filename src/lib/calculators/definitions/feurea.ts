import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const feurea: CalculatorDefinition = {
  slug: "fractional-excretion-urea",
  title: "Fractional Excretion of Urea (FeUrea)",
  shortName: "FeUrea",
  description:
    "Estimates fractional excretion of urea, often used when diuretics limit FeNa interpretation.",
  category: "nephrology",
  icon: "kidney",
  clinicalApplication:
    "Educational adjunct in AKI work-up after diuretic exposure.",
  evidence: {
    version: "FeUrea (%) = (UUrea × PCr) / (PUrea × UCr) × 100",
    intendedPopulation: "Adults with AKI and paired urea/creatinine measurements.",
    exclusions: [
      "Use as sole determinant of pre-renal vs ATN",
      "Unreliable assays or non-simultaneous samples",
    ],
    references: [
      {
        title: "Urinary indices in acute renal failure",
        citation: "Carvounis CP, et al. Kidney Int. 2002;62(6):2223–2229.",
        url: "https://pubmed.ncbi.nlm.nih.gov/12427149/",
      },
      {
        title: "Fractional excretion of urea as a guide to renal dysfunction",
        citation: "Kaplan AA, Kohn OF. Am J Nephrol. 1992;12(1-2):49–54.",
        url: "https://pubmed.ncbi.nlm.nih.gov/1415365/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "uurea", label: "Urine urea", type: "number", suffix: "same unit as plasma urea", min: 0.1, max: 1000, step: 0.1 },
    { id: "purea", label: "Plasma urea", type: "number", suffix: "same unit as urine urea", min: 0.1, max: 100, step: 0.1 },
    { id: "ucr", label: "Urine creatinine", type: "number", suffix: "same unit as plasma Cr", min: 0.1, max: 50000, step: 0.1 },
    { id: "pcr", label: "Plasma creatinine", type: "number", suffix: "same unit as urine Cr", min: 0.1, max: 2000, step: 0.1 },
  ],
  calculate: (values) => {
    const uurea = asNumber(values.uurea);
    const purea = asNumber(values.purea);
    const ucr = asNumber(values.ucr);
    const pcr = asNumber(values.pcr);
    if (purea <= 0 || ucr <= 0) throw new Error("Plasma urea and urine creatinine must be > 0.");
    const value = ((uurea * pcr) / (purea * ucr)) * 100;
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Indeterminate FeUrea band";
    if (value < 35) {
      severity = "moderate";
      label = "FeUrea < 35% — often discussed as pre-renal pattern";
    } else if (value > 50) {
      severity = "high";
      label = "FeUrea > 50% — often discussed as intrinsic pattern";
    }
    return formulaResult({
      value,
      unit: "%",
      digits: 1,
      label,
      severity,
      interpretation: `FeUrea ${roundTo(value, 1)}%.`,
      clinicalSignificance:
        "May retain utility after diuretics when FeNa is uninterpretable, with substantial overlap between categories.",
      limitations:
        "Cut-offs vary; sepsis and CKD confound interpretation.",
      details: [
        { label: "U urea", value: `${uurea}` },
        { label: "P urea", value: `${purea}` },
        { label: "UCr", value: `${ucr}` },
        { label: "PCr", value: `${pcr}` },
        { label: "FeUrea", value: `${roundTo(value, 1)}%` },
      ],
      recommendations: [
        "Integrate with volume exam, urine microscopy, and clinical course.",
        "Do not withhold fluids or dialysis decisions based on FeUrea alone.",
      ],
    });
  },
};
