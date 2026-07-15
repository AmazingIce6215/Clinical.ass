import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const correctedSodium: CalculatorDefinition = {
  slug: "corrected-sodium-hyperglycemia",
  title: "Corrected Sodium in Hyperglycemia",
  shortName: "Corr Na",
  description:
    "Adjusts measured sodium for marked hyperglycemia using a common correction factor.",
  category: "nephrology",
  icon: "flask-conical",
  clinicalApplication:
    "Educational estimate of sodium when hyperglycemia dilutes measured Na in DKA/HHS teaching cases.",
  evidence: {
    version: "Corrected Na ≈ measured Na + 1.6 × ((glucose mg/dL − 100)/100); SI conversion used",
    intendedPopulation: "Adults with significant hyperglycemia and measured serum sodium.",
    exclusions: [
      "Use without confirming glucose and sodium units",
      "Replacement for full hyperosmolar crisis management protocols",
    ],
    references: [
      {
        title: "Hyperglycemic crises in adult patients with diabetes",
        citation: "Kitabchi AE, et al. Diabetes Care. 2009;32(7):1335–1343.",
        url: "https://pubmed.ncbi.nlm.nih.gov/19564476/",
      },
      {
        title: "The impact of hyperglycemia on sodium",
        citation: "Hillier TA, et al. Am J Med. 1999;106(4):399–403.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10225241/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "na", label: "Measured sodium", type: "number", suffix: "mmol/L", min: 100, max: 180, step: 0.1 },
    {
      id: "glucose",
      label: "Glucose",
      type: "number",
      suffix: "mmol/L",
      min: 2,
      max: 80,
      step: 0.1,
      helpText: "mmol/L (mg/dL ÷ 18).",
    },
  ],
  calculate: (values) => {
    const na = asNumber(values.na);
    const glucoseMmol = asNumber(values.glucose);
    const glucoseMgDl = glucoseMmol * 18;
    const corrected = na + 1.6 * ((glucoseMgDl - 100) / 100);

    return formulaResult({
      value: corrected,
      unit: "mmol/L",
      digits: 1,
      label: "Glucose-corrected sodium estimate",
      interpretation: `Corrected sodium ≈ ${roundTo(corrected, 1)} mmol/L (measured ${na} at glucose ${glucoseMmol} mmol/L).`,
      clinicalSignificance:
        "Helps interpret true hypo-/hypernatraemia during severe hyperglycemia. Correction factors of 1.6–2.4 are used in literature.",
      limitations:
        "Not a substitute for serial labs during treatment of DKA/HHS. Factor choice affects the estimate.",
      details: [
        { label: "Measured Na", value: `${na}` },
        { label: "Glucose", value: `${glucoseMmol} mmol/L` },
        { label: "Corrected Na", value: `${roundTo(corrected, 1)}` },
      ],
      recommendations: [
        "Manage DKA/HHS using local protocol, not the corrected sodium alone.",
        "Monitor electrolytes frequently during insulin and fluid therapy.",
      ],
    });
  },
};
