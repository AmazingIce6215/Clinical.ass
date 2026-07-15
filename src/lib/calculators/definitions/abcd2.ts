import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const abcd2: CalculatorDefinition = {
  slug: "abcd2",
  title: "ABCD² Score",
  shortName: "ABCD²",
  description:
    "Estimates short-term stroke risk after transient ischaemic attack using clinical features.",
  category: "neurology",
  icon: "brain",
  clinicalApplication:
    "Educational risk banding after TIA. Many services use urgent TIA clinic pathways regardless of low scores.",
  evidence: {
    version: "ABCD² score",
    intendedPopulation: "Adults with suspected TIA for short-term stroke-risk teaching.",
    exclusions: [
      "Ongoing stroke symptoms (not a TIA)",
      "Use to delay urgent evaluation when clinical concern is high",
    ],
    references: [
      {
        title: "Validation and refinement of scores to predict very early stroke risk after TIA",
        citation: "Johnston SC, et al. Lancet. 2007;369(9558):283–292.",
        url: "https://pubmed.ncbi.nlm.nih.gov/17258668/",
      },
      {
        title: "NICE / stroke pathway context for TIA",
        citation: "National clinical guidelines for stroke / TIA assessment.",
        url: "https://www.nice.org.uk/guidance/ng128",
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
        { label: "< 60 years (0)", value: "0", points: 0 },
        { label: "≥ 60 years (1)", value: "1", points: 1 },
      ],
    },
    {
      id: "bp",
      label: "Blood pressure at assessment",
      type: "select",
      options: [
        { label: "SBP < 140 and DBP < 90 (0)", value: "0", points: 0 },
        { label: "SBP ≥ 140 or DBP ≥ 90 (1)", value: "1", points: 1 },
      ],
    },
    {
      id: "clinical",
      label: "Clinical features",
      type: "select",
      options: [
        { label: "Other symptoms (0)", value: "0", points: 0 },
        { label: "Speech disturbance without weakness (1)", value: "1", points: 1 },
        { label: "Unilateral weakness (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "duration",
      label: "Duration of symptoms",
      type: "select",
      options: [
        { label: "< 10 minutes (0)", value: "0", points: 0 },
        { label: "10–59 minutes (1)", value: "1", points: 1 },
        { label: "≥ 60 minutes (2)", value: "2", points: 2 },
      ],
    },
    { id: "diabetes", label: "Diabetes mellitus (1)", type: "boolean" },
  ],
  calculate: (values) => {
    const score =
      sumSelectPoints(values, [
        { id: "age", options: abcd2.inputs[0].options },
        { id: "bp", options: abcd2.inputs[1].options },
        { id: "clinical", options: abcd2.inputs[2].options },
        { id: "duration", options: abcd2.inputs[3].options },
      ]) + (values.diabetes ? 1 : 0);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Lower ABCD² band (0–3)";
    if (score >= 6) {
      severity = "high";
      label = "Higher ABCD² band (6–7)";
    } else if (score >= 4) {
      severity = "moderate";
      label = "Intermediate ABCD² band (4–5)";
    }
    return scoreResult({
      score,
      maxScore: 7,
      label,
      severity,
      interpretation: `ABCD² score ${score}/7.`,
      clinicalSignificance:
        "Higher scores associate with higher early stroke risk after TIA in derivation cohorts; absolute risk and pathway design vary.",
      limitations:
        "Not a substitute for expert TIA assessment, imaging, and secondary prevention. Some high-risk mechanisms occur at low scores.",
      recommendations: [
        "Arrange urgent specialist TIA/stroke assessment per local protocol.",
        "Start secondary prevention measures as indicated after diagnosis is confirmed.",
      ],
    });
  },
};
