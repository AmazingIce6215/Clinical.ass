import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const idealBodyWeight: CalculatorDefinition = {
  slug: "ideal-body-weight",
  title: "Ideal Body Weight (Devine)",
  shortName: "IBW",
  description:
    "Estimates ideal body weight using the Devine formula, often used for weight-based drug dosing discussions.",
  category: "general",
  icon: "scale",
  clinicalApplication:
    "Educational estimate of ideal body weight for selected drug-dosing contexts. Confirm the dosing weight specified by the local protocol.",
  evidence: {
    version: "Devine 1974 ideal body weight",
    intendedPopulation:
      "Adults for whom an IBW estimate is requested in educational or protocol-based dosing discussions.",
    exclusions: [
      "Children",
      "Pregnancy",
      "Situations requiring adjusted body weight, lean body weight, or measured PK guidance instead of IBW",
    ],
    references: [
      {
        title: "Gentamicin therapy",
        citation: "Devine BJ. Drug Intell Clin Pharm. 1974;8:650–655.",
        url: "https://doi.org/10.1177/106002807400801104",
      },
      {
        title: "Lean body weight estimation",
        citation: "Pai MP, Paloucek FP. Ann Pharmacother. 2000;34(9):1066–1069.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10981254/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "sex",
      label: "Sex",
      type: "select",
      options: [
        { label: "Male", value: "male", points: 0 },
        { label: "Female", value: "female", points: 0 },
      ],
    },
    { id: "height", label: "Height", type: "number", suffix: "cm", min: 100, max: 230, step: 0.1 },
  ],
  calculate: (values) => {
    const heightCm = asNumber(values.height);
    const heightIn = heightCm / 2.54;
    const inchesOver5ft = heightIn - 60;
    const base = values.sex === "female" ? 45.5 : 50;
    const ibw = base + 2.3 * inchesOver5ft;

    return formulaResult({
      value: ibw,
      unit: "kg",
      digits: 1,
      label: "Estimated ideal body weight",
      interpretation: `Devine IBW ≈ ${roundTo(ibw, 1)} kg.`,
      clinicalSignificance:
        "IBW is a historical dosing construct. Many modern protocols prefer adjusted body weight, lean body weight, or fixed dosing.",
      limitations:
        "Less accurate at extremes of height. Does not account for body composition, ethnicity, or frailty.",
      details: [
        { label: "Sex", value: String(values.sex) },
        { label: "Height", value: `${heightCm} cm` },
        { label: "IBW (Devine)", value: `${roundTo(ibw, 1)} kg` },
      ],
      recommendations: [
        "Check the specific drug monograph for which weight metric to use.",
        "Consider renal function and clinical context before applying any weight-based dose.",
      ],
    });
  },
};
