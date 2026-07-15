import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const ranson: CalculatorDefinition = {
  slug: "ranson",
  title: "Ranson's Criteria (Pancreatitis)",
  shortName: "Ranson",
  description:
    "Classic severity criteria for acute pancreatitis using admission and 48-hour variables.",
  category: "gastroenterology",
  icon: "stethoscope",
  clinicalApplication:
    "Educational severity estimate. BISAP and organ-failure scores are often more practical early on.",
  evidence: {
    version: "Ranson criteria (gallstone and non-gallstone teaching set combined as common checklist)",
    intendedPopulation: "Adults with acute pancreatitis when 48-hour labs are available.",
    exclusions: [
      "Incomplete 48-hour data — score incomplete",
      "Chronic pancreatitis without acute criteria",
    ],
    references: [
      {
        title: "Prognostic signs and nonoperative peritoneal lavage in acute pancreatitis",
        citation: "Ranson JH, et al. Surg Gynecol Obstet. 1974;139(1):69–81.",
        url: "https://pubmed.ncbi.nlm.nih.gov/4834279/",
      },
      {
        title: "AGA clinical practice update on acute pancreatitis",
        citation: "Crockett SD, et al. Gastroenterology. 2018;154(4):1096–1101.",
        url: "https://pubmed.ncbi.nlm.nih.gov/29409760/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age", label: "On admission: Age > 55 years", type: "boolean" },
    { id: "wbc", label: "On admission: WBC > 16 ×10⁹/L", type: "boolean" },
    { id: "glucose", label: "On admission: Glucose > 10 mmol/L (>200 mg/dL)", type: "boolean" },
    { id: "ldh", label: "On admission: LDH > 350 U/L", type: "boolean" },
    { id: "ast", label: "On admission: AST > 250 U/L", type: "boolean" },
    { id: "hct_drop", label: "At 48 h: Hematocrit fall > 10%", type: "boolean" },
    { id: "bun_rise", label: "At 48 h: BUN rise > 1.8 mmol/L (>5 mg/dL)", type: "boolean" },
    { id: "calcium", label: "At 48 h: Calcium < 2 mmol/L (<8 mg/dL)", type: "boolean" },
    { id: "pao2", label: "At 48 h: PaO₂ < 60 mmHg", type: "boolean" },
    { id: "base_deficit", label: "At 48 h: Base deficit > 4 mEq/L", type: "boolean" },
    { id: "fluid", label: "At 48 h: Fluid sequestration > 6 L", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, [
      "age",
      "wbc",
      "glucose",
      "ldh",
      "ast",
      "hct_drop",
      "bun_rise",
      "calcium",
      "pao2",
      "base_deficit",
      "fluid",
    ]);
    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Milder Ranson band (0–2)";
    if (score >= 7) {
      severity = "severe";
      label = "Very high Ranson band (≥7)";
    } else if (score >= 5) {
      severity = "high";
      label = "Higher Ranson band (5–6)";
    } else if (score >= 3) {
      severity = "moderate";
      label = "Intermediate Ranson band (3–4)";
    }
    return scoreResult({
      score,
      maxScore: 11,
      label,
      severity,
      interpretation: `Ranson criteria ${score}/11 met.`,
      clinicalSignificance:
        "Higher scores historically associated with increased mortality; modern care has improved absolute outcomes.",
      limitations:
        "Requires 48 hours. Thresholds differ slightly for gallstone pancreatitis in original papers.",
      recommendations:
        score >= 3
          ? [
              "Close monitoring for organ failure; consider HDU/ICU thresholds.",
              "Supportive care, early nutrition planning, and complication surveillance.",
            ]
          : [
              "Continue standard pancreatitis care and reassess at 48 hours.",
              "Watch for evolving SIRS or organ dysfunction.",
            ],
    });
  },
};
