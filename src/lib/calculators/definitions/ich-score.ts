import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const ichScore: CalculatorDefinition = {
  slug: "ich-score",
  title: "ICH Score",
  shortName: "ICH Score",
  description:
    "Predicts 30-day mortality after spontaneous intracerebral haemorrhage.",
  category: "neurology",
  icon: "brain",
  clinicalApplication:
    "Educational prognostic estimate after ICH diagnosis. Does not determine futility alone.",
  evidence: {
    version: "Original ICH Score (Hemphill)",
    intendedPopulation: "Adults with spontaneous ICH.",
    exclusions: [
      "Traumatic ICH without adaptation",
      "Sole basis for withdrawal of care decisions",
    ],
    references: [
      {
        title: "The ICH score: a simple, reliable grading scale for intracerebral hemorrhage",
        citation: "Hemphill JC, et al. Stroke. 2001;32(4):891–897.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11283388/",
      },
      {
        title: "AHA/ASA ICH guidelines",
        citation: "Greenberg SM, et al. Stroke. 2022;53(7):e282–e361.",
        url: "https://pubmed.ncbi.nlm.nih.gov/35579034/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "gcs",
      label: "GCS",
      type: "select",
      options: [
        { label: "13–15 (0)", value: "0", points: 0 },
        { label: "5–12 (1)", value: "1", points: 1 },
        { label: "3–4 (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "volume",
      label: "ICH volume",
      type: "select",
      options: [
        { label: "< 30 cm³ (0)", value: "0", points: 0 },
        { label: "≥ 30 cm³ (1)", value: "1", points: 1 },
      ],
    },
    {
      id: "ivh",
      label: "Intraventricular haemorrhage",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (1)", value: "1", points: 1 },
      ],
    },
    {
      id: "infratentorial",
      label: "Infratentorial origin",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (1)", value: "1", points: 1 },
      ],
    },
    {
      id: "age",
      label: "Age",
      type: "select",
      options: [
        { label: "< 80 (0)", value: "0", points: 0 },
        { label: "≥ 80 (1)", value: "1", points: 1 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, ichScore.inputs);
    let severity: "low" | "moderate" | "high" | "severe" | "critical" = "low";
    let label = "Lower ICH score band";
    if (score >= 4) {
      severity = "critical";
      label = "Very high ICH score band";
    } else if (score === 3) {
      severity = "severe";
      label = "High ICH score band";
    } else if (score === 2) {
      severity = "high";
      label = "Intermediate–high band";
    } else if (score === 1) {
      severity = "moderate";
      label = "Intermediate band";
    }
    return scoreResult({
      score,
      maxScore: 6,
      label,
      severity,
      interpretation: `ICH score ${score}/6.`,
      clinicalSignificance:
        "Higher scores associate with higher 30-day mortality in derivation cohorts; modern care may improve outcomes.",
      limitations:
        "Self-fulfilling prophecy risk if used alone for care limitation. Does not capture all prognostic factors.",
      recommendations: [
        "Urgent stroke/neurosurgical pathways for ICH.",
        "BP management, reverse anticoagulation, and airway support per guideline.",
      ],
    });
  },
};
