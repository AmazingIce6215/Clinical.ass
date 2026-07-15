import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const timiStemi: CalculatorDefinition = {
  slug: "timi-stemi",
  title: "TIMI Risk Score (STEMI)",
  shortName: "TIMI STEMI",
  description:
    "Predicts 30-day mortality risk in ST-elevation myocardial infarction using presentation features.",
  category: "cardiology",
  icon: "activity",
  clinicalApplication:
    "Educational risk banding in STEMI after diagnosis. Does not replace reperfusion pathways.",
  evidence: {
    version: "TIMI STEMI risk score (Morrow)",
    intendedPopulation: "Adults with STEMI in acute coronary care teaching settings.",
    exclusions: [
      "NSTE-ACS (use TIMI NSTEMI/UA)",
      "Use to delay primary reperfusion decisions",
    ],
    references: [
      {
        title: "TIMI risk score for ST-elevation myocardial infarction",
        citation: "Morrow DA, et al. Circulation. 2000;102(17):2031–2037.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11044416/",
      },
      {
        title: "ESC STEMI guidelines risk assessment context",
        citation: "Ibanez B, et al. Eur Heart J. 2018;39(2):119–177.",
        url: "https://pubmed.ncbi.nlm.nih.gov/28886621/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "age",
      label: "Age",
      type: "select",
      options: [
        { label: "< 65 years (0)", value: "0", points: 0 },
        { label: "65–74 years (2)", value: "2", points: 2 },
        { label: "≥ 75 years (3)", value: "3", points: 3 },
      ],
    },
    {
      id: "sbp_hr",
      label: "SBP and heart rate",
      type: "select",
      options: [
        { label: "SBP ≥ 100 and HR ≤ 100 (0)", value: "0", points: 0 },
        { label: "SBP < 100 mmHg (3)", value: "sbp", points: 3 },
        { label: "HR > 100/min (2)", value: "hr", points: 2 },
        { label: "Both SBP < 100 and HR > 100 (5)", value: "both", points: 5 },
      ],
    },
    { id: "killip_ii_iv", label: "Killip class II–IV (2)", type: "boolean" },
    { id: "weight", label: "Weight < 67 kg (1)", type: "boolean" },
    { id: "anterior_lbbb", label: "Anterior STEMI or LBBB (1)", type: "boolean" },
    { id: "time", label: "Time to treatment > 4 hours (1)", type: "boolean" },
    { id: "dm_htn_angina", label: "History of DM, HTN, or angina (1)", type: "boolean" },
  ],
  calculate: (values) => {
    const score =
      sumSelectPoints(values, [
        { id: "age", options: timiStemi.inputs[0].options },
        { id: "sbp_hr", options: timiStemi.inputs[1].options },
      ]) +
      (values.killip_ii_iv ? 2 : 0) +
      (values.weight ? 1 : 0) +
      (values.anterior_lbbb ? 1 : 0) +
      (values.time ? 1 : 0) +
      (values.dm_htn_angina ? 1 : 0);

    let severity: "low" | "moderate" | "high" | "severe" | "critical" = "low";
    let label = "Lower TIMI STEMI band (0–2)";
    if (score >= 8) {
      severity = "critical";
      label = "Highest TIMI STEMI band (≥8)";
    } else if (score >= 6) {
      severity = "severe";
      label = "High TIMI STEMI band (6–7)";
    } else if (score >= 4) {
      severity = "high";
      label = "Intermediate–high band (4–5)";
    } else if (score >= 3) {
      severity = "moderate";
      label = "Intermediate band (3)";
    }

    return scoreResult({
      score,
      maxScore: 14,
      label,
      severity,
      interpretation: `TIMI STEMI score ${score}/14.`,
      clinicalSignificance:
        "Higher scores associate with higher 30-day mortality in fibrinolysis-era cohorts; modern absolute risks are lower with primary PCI.",
      limitations:
        "Derived largely in fibrinolysis trials. Always prioritise timely reperfusion and shock management.",
      recommendations: [
        "Continue STEMI pathway without delay for scoring.",
        "Higher scores warrant intensified monitoring and senior cardiology involvement.",
      ],
    });
  },
};
