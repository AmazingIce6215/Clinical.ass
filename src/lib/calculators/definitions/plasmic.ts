import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const plasmic: CalculatorDefinition = {
  slug: "plasmic",
  title: "PLASMIC Score for TTP",
  shortName: "PLASMIC",
  description:
    "Predicts severe ADAMTS13 deficiency in suspected thrombotic thrombocytopenic purpura.",
  category: "hematology",
  icon: "droplets",
  clinicalApplication:
    "Supports urgency of plasma exchange while ADAMTS13 results are pending.",
  evidence: {
    version: "PLASMIC score (Bendapudi)",
    intendedPopulation: "Adults with thrombocytopenia and schistocytic anaemia evaluated for TTP.",
    exclusions: [
      "Known alternative TMA already diagnosed",
      "Children without paediatric adaptation",
    ],
    references: [
      {
        title: "Derivation and external validation of the PLASMIC score for rapid assessment of adults with TTP",
        citation: "Bendapudi PK, et al. Lancet Haematol. 2017;4(4):e157–e164.",
        url: "https://pubmed.ncbi.nlm.nih.gov/28259520/",
      },
      {
        title: "ISTH TTP guidelines",
        citation: "Zheng XL, et al. J Thromb Haemost. 2020.",
        url: "https://pubmed.ncbi.nlm.nih.gov/32914526/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "plt", label: "Platelet count < 30 ×10⁹/L (1)", type: "boolean" },
    { id: "hemolysis", label: "Evidence of hemolysis (1)", type: "boolean" },
    { id: "no_cancer", label: "No active cancer (1)", type: "boolean" },
    { id: "no_transplant", label: "No solid-organ or stem-cell transplant (1)", type: "boolean" },
    { id: "mcv", label: "MCV < 90 fL (1)", type: "boolean" },
    { id: "inr", label: "INR < 1.5 (1)", type: "boolean" },
    { id: "creatinine", label: "Creatinine < 2.0 mg/dL (<177 µmol/L) (1)", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, [
      "plt",
      "hemolysis",
      "no_cancer",
      "no_transplant",
      "mcv",
      "inr",
      "creatinine",
    ]);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Low probability of severe ADAMTS13 deficiency (0–4)";
    if (score >= 6) {
      severity = "high";
      label = "High probability band (6–7)";
    } else if (score === 5) {
      severity = "moderate";
      label = "Intermediate probability band (5)";
    }
    return scoreResult({
      score,
      maxScore: 7,
      label,
      severity,
      interpretation: `PLASMIC ${score}/7.`,
      clinicalSignificance:
        "High scores support urgent plasma exchange and haematology involvement while awaiting ADAMTS13 activity.",
      limitations:
        "Does not replace ADAMTS13 assay. Other TMAs can overlap clinically.",
      recommendations:
        score >= 5
          ? [
              "Urgent haematology consult; do not delay PEX if TTP is likely.",
              "Send ADAMTS13 before transfusion if possible.",
            ]
          : [
              "Evaluate alternative TMA causes (DIC, malignant HTN, HUS, drugs).",
              "Still seek haematology advice if clinical suspicion remains.",
            ],
    });
  },
};
