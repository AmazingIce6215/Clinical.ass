import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const alvarado: CalculatorDefinition = {
  slug: "alvarado",
  title: "Alvarado Score for Appendicitis",
  shortName: "Alvarado",
  description:
    "Clinical scoring system to estimate likelihood of acute appendicitis.",
  category: "surgery",
  icon: "stethoscope",
  clinicalApplication:
    "Supports structured assessment of suspected appendicitis. Imaging and surgical review remain central.",
  evidence: {
    version: "Alvarado (MANTRELS) 10-point score",
    intendedPopulation: "Patients with suspected acute appendicitis in acute-care settings.",
    exclusions: [
      "Pregnancy without obstetric/surgical co-assessment",
      "Use as sole criterion to operate or discharge without appropriate imaging/review",
    ],
    references: [
      {
        title: "A practical score for the early diagnosis of acute appendicitis",
        citation: "Alvarado A. Ann Emerg Med. 1986;15(5):557–564.",
        url: "https://pubmed.ncbi.nlm.nih.gov/3963537/",
      },
      {
        title: "Alvarado score performance reviews",
        citation: "Ohle R, et al. BMC Med. 2011;9:139.",
        url: "https://pubmed.ncbi.nlm.nih.gov/22173765/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "migration", label: "Migration of pain to RLQ (1)", type: "boolean" },
    { id: "anorexia", label: "Anorexia (1)", type: "boolean" },
    { id: "nausea", label: "Nausea or vomiting (1)", type: "boolean" },
    { id: "rlq", label: "RLQ tenderness (2)", type: "boolean" },
    { id: "rebound", label: "Rebound tenderness (1)", type: "boolean" },
    { id: "fever", label: "Temperature ≥ 37.3°C (1)", type: "boolean" },
    { id: "leukocytosis", label: "Leukocytosis > 10 ×10⁹/L (2)", type: "boolean" },
    { id: "left_shift", label: "Left shift / neutrophilia (1)", type: "boolean" },
  ],
  calculate: (values) => {
    const score =
      (values.migration ? 1 : 0) +
      (values.anorexia ? 1 : 0) +
      (values.nausea ? 1 : 0) +
      (values.rlq ? 2 : 0) +
      (values.rebound ? 1 : 0) +
      (values.fever ? 1 : 0) +
      (values.leukocytosis ? 2 : 0) +
      (values.left_shift ? 1 : 0);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Lower likelihood band";
    if (score >= 7) {
      severity = "high";
      label = "Higher likelihood band";
    } else if (score >= 5) {
      severity = "moderate";
      label = "Intermediate likelihood band";
    }
    return scoreResult({
      score,
      maxScore: 10,
      label,
      severity,
      interpretation: `Alvarado score ${score}/10.`,
      clinicalSignificance:
        "Scores ≤4 often suggest low likelihood; ≥7 higher likelihood, but imaging strategies differ by age, sex, and local practice.",
      limitations:
        "Performance varies, especially in women and children. Not a substitute for surgical assessment.",
      recommendations:
        score <= 4
          ? ["Consider alternative diagnoses and observation pathways.", "Safety-net for progressive pain or fever."]
          : [
              "Surgical review and selective imaging are commonly appropriate.",
              "Keep nil-by-mouth and fluid/analgesia plans per local protocol while evaluating.",
            ],
    });
  },
};
