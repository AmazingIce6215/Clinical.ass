import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const correctedCalcium: CalculatorDefinition = {
  slug: "corrected-calcium",
  title: "Calcium Correction for Hypoalbuminemia",
  shortName: "Corr Ca",
  description: "Estimates albumin-adjusted calcium using a common Payne-style correction.",
  category: "endocrinology",
  icon: "flask-conical",
  clinicalApplication:
    "Educational adjustment when total calcium is interpreted with low albumin. Ionized calcium is preferred when available.",
  evidence: {
    version: "Corrected Ca (mg/dL) ≈ total Ca + 0.8 × (4 − albumin g/dL); SI form used",
    intendedPopulation: "Adults with total calcium and albumin measured on the same sample set.",
    exclusions: [
      "Critical illness where ionized calcium is required",
      "Marked acid–base disturbance, hyperphosphataemia, or paraproteinaemia",
    ],
    references: [
      {
        title: "Interpretation of serum calcium in patients with abnormal serum proteins",
        citation: "Payne RB, et al. Br Med J. 1973;4(5893):643–646.",
        url: "https://pubmed.ncbi.nlm.nih.gov/4758544/",
      },
      {
        title: "Calcium correction equations and ionized calcium",
        citation: "Slomp J, et al. Crit Care Med. 2003;31(5):1389–1393.",
        url: "https://pubmed.ncbi.nlm.nih.gov/12771607/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "calcium",
      label: "Total calcium",
      type: "number",
      suffix: "mmol/L",
      min: 0.5,
      max: 4,
      step: 0.01,
      helpText: "SI units. (mg/dL ÷ 4 ≈ mmol/L)",
    },
    {
      id: "albumin",
      label: "Albumin",
      type: "number",
      suffix: "g/L",
      min: 10,
      max: 60,
      step: 0.1,
      helpText: "Enter albumin in g/L (g/dL × 10).",
    },
  ],
  calculate: (values) => {
    const ca = asNumber(values.calcium);
    const albuminGL = asNumber(values.albumin);
    // Convert to conventional units for Payne formula then back to mmol/L
    const caMgDl = ca * 4;
    const albuminGdL = albuminGL / 10;
    const correctedMgDl = caMgDl + 0.8 * (4 - albuminGdL);
    const correctedMmol = correctedMgDl / 4;

    let severity: "low" | "moderate" | "high" = "low";
    let label = "Corrected calcium near common reference band";
    if (correctedMmol < 2.1) {
      severity = "moderate";
      label = "Low corrected calcium band";
    } else if (correctedMmol > 2.6) {
      severity = "high";
      label = "High corrected calcium band";
    }

    return formulaResult({
      value: correctedMmol,
      unit: "mmol/L",
      digits: 2,
      label,
      severity,
      interpretation: `Albumin-corrected calcium ≈ ${roundTo(correctedMmol, 2)} mmol/L.`,
      clinicalSignificance:
        "Correction is a bedside estimate. Ionized calcium better reflects biologically active calcium in acute care.",
      limitations:
        "Formulas and normal albumin assumptions vary. Unreliable in critically ill and acidotic patients.",
      details: [
        { label: "Total Ca", value: `${ca} mmol/L` },
        { label: "Albumin", value: `${albuminGL} g/L` },
        { label: "Corrected Ca", value: `${roundTo(correctedMmol, 2)} mmol/L` },
      ],
      recommendations: [
        "Prefer ionized calcium when symptoms or critical illness are present.",
        "Investigate underlying causes rather than treating the number alone.",
      ],
    });
  },
};
