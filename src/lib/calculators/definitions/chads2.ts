import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const chads2: CalculatorDefinition = {
  slug: "chads2",
  title: "CHADS₂ Score for Atrial Fibrillation",
  shortName: "CHADS₂",
  description:
    "Older stroke risk score in non-valvular atrial fibrillation; largely superseded by CHA₂DS₂-VASc in practice.",
  category: "cardiology",
  icon: "activity",
  clinicalApplication:
    "Educational comparison with CHA₂DS₂-VASc. Prefer CHA₂DS₂-VASc for contemporary anticoagulation decisions.",
  evidence: {
    version: "Original CHADS₂",
    intendedPopulation: "Adults with non-valvular AF for historical stroke-risk teaching.",
    exclusions: [
      "Valvular AF / moderate–severe mitral stenosis / mechanical valves",
      "Replacement for CHA₂DS₂-VASc in modern pathways",
    ],
    references: [
      {
        title: "Validation of clinical classification schemes for predicting stroke",
        citation: "Gage BF, et al. JAMA. 2001;285(22):2864–2870.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11401607/",
      },
      {
        title: "2010 ESC Guidelines for AF (CHA2DS2-VASc)",
        citation: "Camm AJ, et al. Eur Heart J. 2010;31(19):2369–2429.",
        url: "https://pubmed.ncbi.nlm.nih.gov/20802247/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "chf", label: "Congestive heart failure (1)", type: "boolean" },
    { id: "htn", label: "Hypertension (1)", type: "boolean" },
    { id: "age", label: "Age ≥ 75 years (1)", type: "boolean" },
    { id: "dm", label: "Diabetes mellitus (1)", type: "boolean" },
    { id: "stroke", label: "Prior stroke/TIA/TE (2)", type: "boolean" },
  ],
  calculate: (values) => {
    const score =
      sumBooleanFields(values, ["chf", "htn", "age", "dm"]) +
      (values.stroke ? 2 : 0);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Lower CHADS₂ band";
    if (score >= 2) {
      severity = "high";
      label = "Higher CHADS₂ band";
    } else if (score === 1) {
      severity = "moderate";
      label = "Intermediate CHADS₂ band";
    }
    return scoreResult({
      score,
      maxScore: 6,
      label,
      severity,
      interpretation: `CHADS₂ ${score}/6.`,
      clinicalSignificance:
        "Historically used to guide warfarin decisions. Contemporary guidelines favour CHA₂DS₂-VASc and bleeding-risk assessment.",
      limitations:
        "Under-classifies some younger patients with vascular disease. Educational use only if local policy has moved on.",
      recommendations: [
        "Prefer CHA₂DS₂-VASc for current stroke-risk discussion.",
        "Assess bleeding risk and patient preferences before anticoagulation.",
      ],
    });
  },
};
