import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const hendersonHasselbalch: CalculatorDefinition = {
  slug: "henderson-hasselbalch",
  title: "Henderson–Hasselbalch (pH from HCO₃/pCO₂)",
  shortName: "H-H",
  description:
    "Estimates pH from bicarbonate and pCO₂ using the Henderson–Hasselbalch relationship.",
  category: "nephrology",
  icon: "flask-conical",
  clinicalApplication:
    "Acid–base teaching to relate measured ABG components. Prefer measured pH clinically.",
  evidence: {
    version: "pH = 6.1 + log10([HCO₃] / (0.0301 × pCO₂))",
    intendedPopulation: "Educational use with serum HCO₃ and arterial pCO₂.",
    exclusions: [
      "Replacement for measured blood gas pH",
      "Extreme temperature/assay conditions without correction",
    ],
    references: [
      {
        title: "Acid-base physiology education (Henderson–Hasselbalch)",
        citation: "Classic physicochemical relationship used in clinical acid–base teaching.",
        url: "https://pubmed.ncbi.nlm.nih.gov/7018788/",
      },
      {
        title: "Clinical acid–base disorders overview",
        citation: "Berend K, et al. N Engl J Med. 2014;371(15):1434–1445.",
        url: "https://pubmed.ncbi.nlm.nih.gov/25295502/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "hco3", label: "HCO₃⁻", type: "number", suffix: "mmol/L", min: 1, max: 60, step: 0.1 },
    { id: "pco2", label: "pCO₂", type: "number", suffix: "mmHg", min: 5, max: 120, step: 0.1 },
  ],
  calculate: (values) => {
    const hco3 = asNumber(values.hco3);
    const pco2 = asNumber(values.pco2);
    if (pco2 <= 0) throw new Error("pCO₂ must be greater than zero.");
    const ph = 6.1 + Math.log10(hco3 / (0.0301 * pco2));
    let severity: "low" | "moderate" | "high" | "critical" = "low";
    let label = "Estimated pH near physiologic band";
    if (ph < 7.2 || ph > 7.6) {
      severity = "critical";
      label = "Markedly abnormal estimated pH band";
    } else if (ph < 7.35 || ph > 7.45) {
      severity = "high";
      label = "Acidemic or alkalemic estimated pH band";
    }
    return formulaResult({
      value: ph,
      digits: 2,
      label,
      severity,
      interpretation: `Estimated pH ${roundTo(ph, 2)} from HCO₃ ${hco3} and pCO₂ ${pco2}.`,
      clinicalSignificance:
        "Illustrates the relationship between metabolic and respiratory components; always use measured ABG pH for decisions.",
      limitations:
        "Assumes equilibrium and standard solubility coefficient. Venous values differ from arterial.",
      details: [
        { label: "HCO₃", value: `${hco3}` },
        { label: "pCO₂", value: `${pco2}` },
        { label: "Estimated pH", value: `${roundTo(ph, 2)}` },
      ],
      recommendations: [
        "Compare with measured ABG and anion/osmolal gaps as indicated.",
        "Identify primary process and compensation rather than treating the number alone.",
      ],
    });
  },
};
