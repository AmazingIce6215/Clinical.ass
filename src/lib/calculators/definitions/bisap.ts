import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const bisap: CalculatorDefinition = {
  slug: "bisap",
  title: "BISAP Score (Pancreatitis)",
  shortName: "BISAP",
  description:
    "Bedside index for severity in acute pancreatitis using five early clinical parameters.",
  category: "gastroenterology",
  icon: "stethoscope",
  clinicalApplication:
    "Early severity risk discussion in acute pancreatitis within the first 24 hours.",
  evidence: {
    version: "BISAP five-item score",
    intendedPopulation: "Adults with acute pancreatitis assessed early in admission.",
    exclusions: [
      "Chronic pancreatitis flare without acute criteria",
      "Children",
    ],
    references: [
      {
        title: "The early prediction of mortality in acute pancreatitis: a large population-based study",
        citation: "Wu BU, et al. Gut. 2008;57(12):1698–1703.",
        url: "https://pubmed.ncbi.nlm.nih.gov/18519429/",
      },
      {
        title: "BISAP prediction of mortality",
        citation: "Singh VK, et al. Am J Gastroenterol. 2009;104(4):966–971.",
        url: "https://pubmed.ncbi.nlm.nih.gov/19293787/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "bun", label: "BUN > 25 mg/dL (> 8.9 mmol/L)", type: "boolean" },
    { id: "ams", label: "Impaired mental status", type: "boolean" },
    { id: "sirs", label: "SIRS present (≥2 criteria)", type: "boolean" },
    { id: "age", label: "Age > 60 years", type: "boolean" },
    { id: "pleural", label: "Pleural effusion", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, ["bun", "ams", "sirs", "age", "pleural"]);
    const high = score >= 3;
    return scoreResult({
      score,
      maxScore: 5,
      label: high ? "Higher severity band (BISAP ≥ 3)" : "Lower severity band (BISAP ≤ 2)",
      severity: high ? "high" : score === 2 ? "moderate" : "low",
      interpretation: `BISAP ${score}/5.`,
      clinicalSignificance:
        "Scores ≥3 associate with higher risk of organ failure and mortality in validation cohorts.",
      limitations:
        "Does not replace imaging for necrosis or full organ-failure scores (Marshall/SOFA).",
      recommendations: high
        ? [
            "Early aggressive monitoring, fluid resuscitation strategy, and senior review.",
            "Assess for organ failure and need for HDU/ICU.",
          ]
        : [
            "Continue guideline-based pancreatitis care and reassess trajectory.",
            "Watch for evolving SIRS, hypoxia, or renal impairment.",
          ],
    });
  },
};
