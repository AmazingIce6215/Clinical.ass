import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const rcri: CalculatorDefinition = {
  slug: "rcri",
  title: "Revised Cardiac Risk Index (Lee)",
  shortName: "RCRI",
  description:
    "Six-item index estimating risk of major cardiac complications after noncardiac surgery.",
  category: "surgery",
  icon: "heart-pulse",
  clinicalApplication:
    "Preoperative cardiac risk teaching for noncardiac surgery. Integrate with functional status and surgery urgency.",
  evidence: {
    version: "Revised Cardiac Risk Index (Lee 1999)",
    intendedPopulation: "Adults undergoing elective noncardiac surgery risk discussion.",
    exclusions: [
      "Emergency surgery without time for elective risk tools",
      "Cardiac surgery",
      "Sole determinant of perioperative testing",
    ],
    references: [
      {
        title: "Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery",
        citation: "Lee TH, et al. Circulation. 1999;100(10):1043–1049.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10477528/",
      },
      {
        title: "2014 ACC/AHA guideline on perioperative cardiovascular evaluation",
        citation: "Fleisher LA, et al. Circulation. 2014;130(24):e278–e333.",
        url: "https://pubmed.ncbi.nlm.nih.gov/25085961/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "high_risk_surgery", label: "High-risk surgery (intraperitoneal, intrathoracic, suprainguinal vascular)", type: "boolean" },
    { id: "ihd", label: "History of ischaemic heart disease", type: "boolean" },
    { id: "hf", label: "History of heart failure", type: "boolean" },
    { id: "cva", label: "History of cerebrovascular disease", type: "boolean" },
    { id: "insulin", label: "Diabetes mellitus treated with insulin", type: "boolean" },
    { id: "creatinine", label: "Preoperative creatinine > 2.0 mg/dL (>177 µmol/L)", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, [
      "high_risk_surgery",
      "ihd",
      "hf",
      "cva",
      "insulin",
      "creatinine",
    ]);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "RCRI 0 — lower risk band";
    if (score >= 3) {
      severity = "high";
      label = "RCRI ≥3 — higher risk band";
    } else if (score === 2) {
      severity = "high";
      label = "RCRI 2 — elevated risk band";
    } else if (score === 1) {
      severity = "moderate";
      label = "RCRI 1 — intermediate risk band";
    }
    return scoreResult({
      score,
      maxScore: 6,
      label,
      severity,
      interpretation: `RCRI ${score}/6.`,
      clinicalSignificance:
        "Each additional factor increases estimated risk of major cardiac complications in original cohorts; absolute rates depend on era and care.",
      limitations:
        "Does not capture frailty, emergency status, or all procedure-specific risks. Functional capacity remains crucial.",
      recommendations: [
        "Combine with METS assessment and shared decision-making.",
        "Follow ACC/AHA or ESC perioperative pathways for further testing.",
      ],
    });
  },
};
