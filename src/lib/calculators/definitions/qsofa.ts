import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const qsofa: CalculatorDefinition = {
  slug: "qsofa",
  title: "qSOFA Score",
  shortName: "qSOFA",
  description:
    "Quick bedside screen for patients with suspected infection at higher risk of poor outcomes.",
  category: "critical-care",
  icon: "shield-alert",
  clinicalApplication:
    "Supports rapid bedside risk prompts in suspected infection. Does not diagnose sepsis alone.",
  evidence: {
    version: "Sepsis-3 qSOFA three-item score",
    intendedPopulation:
      "Adults with suspected infection outside the ICU for bedside risk stratification teaching.",
    exclusions: [
      "Confirmed alternative diagnosis without infection concern",
      "Children",
      "Replacement for full SOFA-based sepsis definitions in research or ICU",
    ],
    references: [
      {
        title: "The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3)",
        citation: "Singer M, et al. JAMA. 2016;315(8):801–810.",
        url: "https://pubmed.ncbi.nlm.nih.gov/26903338/",
      },
      {
        title: "Assessment of Clinical Criteria for Sepsis",
        citation: "Seymour CW, et al. JAMA. 2016;315(8):762–774.",
        url: "https://pubmed.ncbi.nlm.nih.gov/26903335/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "rr", label: "Respiratory rate ≥ 22/min", type: "boolean" },
    { id: "sbp", label: "Systolic BP ≤ 100 mmHg", type: "boolean" },
    { id: "ams", label: "Altered mentation", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, ["rr", "sbp", "ams"]);
    const high = score >= 2;
    return scoreResult({
      score,
      maxScore: 3,
      label: high ? "≥2 — higher-risk qSOFA band" : "<2 — lower qSOFA band",
      severity: high ? "high" : "low",
      interpretation: `qSOFA ${score}/3.`,
      clinicalSignificance:
        "A score ≥2 identifies patients who may warrant closer monitoring and evaluation for organ dysfunction, but sensitivity is limited.",
      limitations:
        "Not a sepsis definition. Lower sensitivity than some warning scores. Always use clinical judgment and local sepsis pathways.",
      details: [
        { label: "RR ≥ 22", value: values.rr ? "Yes" : "No" },
        { label: "SBP ≤ 100", value: values.sbp ? "Yes" : "No" },
        { label: "Altered mentation", value: values.ams ? "Yes" : "No" },
      ],
      recommendations: high
        ? [
            "Escalate assessment for infection-related organ dysfunction per local sepsis pathway.",
            "Review lactate, cultures, source control, and antimicrobial timing with the responsible team.",
          ]
        : [
            "Continue clinical observation; qSOFA does not rule out serious infection.",
            "Reassess if vital signs or mentation change.",
          ],
    });
  },
};
