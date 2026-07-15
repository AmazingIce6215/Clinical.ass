import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

const opts = [
  { label: "Not at all (0)", value: "0", points: 0 },
  { label: "Several days (1)", value: "1", points: 1 },
  { label: "More than half the days (2)", value: "2", points: 2 },
  { label: "Nearly every day (3)", value: "3", points: 3 },
];

export const phq2: CalculatorDefinition = {
  slug: "phq-2",
  title: "Patient Health Questionnaire-2 (PHQ-2)",
  shortName: "PHQ-2",
  description:
    "Two-item depression screen; positive results should prompt PHQ-9 or clinical assessment.",
  category: "mental-health",
  icon: "brain",
  clinicalApplication:
    "Ultra-brief depression screening in primary and general medical settings.",
  evidence: {
    version: "PHQ-2 (Kroenke)",
    intendedPopulation: "Adults undergoing routine depression screening.",
    exclusions: [
      "Sole diagnostic tool",
      "Emergency psychiatric crisis without safety assessment",
    ],
    references: [
      {
        title: "The Patient Health Questionnaire-2",
        citation: "Kroenke K, Spitzer RL, Williams JB. Med Care. 2003;41(11):1284–1292.",
        url: "https://pubmed.ncbi.nlm.nih.gov/14583691/",
      },
      {
        title: "PHQ-9 validation companion work",
        citation: "Kroenke K, et al. J Gen Intern Med. 2001;16(9):606–613.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11556941/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "interest",
      label: "Little interest or pleasure in doing things",
      type: "select",
      options: opts,
    },
    {
      id: "depressed",
      label: "Feeling down, depressed, or hopeless",
      type: "select",
      options: opts,
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, [
      { id: "interest", options: opts },
      { id: "depressed", options: opts },
    ]);
    const positive = score >= 3;
    return scoreResult({
      score,
      maxScore: 6,
      label: positive ? "Positive PHQ-2 screen (≥3)" : "Negative PHQ-2 screen",
      severity: positive ? "moderate" : "low",
      interpretation: `PHQ-2 ${score}/6.`,
      clinicalSignificance:
        "A cut-off of ≥3 is commonly used to trigger full PHQ-9 evaluation.",
      limitations:
        "High false-positive rate possible; does not assess suicidality comprehensively.",
      recommendations: positive
        ? [
            "Administer PHQ-9 and explore functional impact.",
            "Assess safety if any suicidal ideation emerges.",
          ]
        : [
            "No further depression questionnaire may be needed unless clinical concern remains.",
            "Re-screen per local preventive care schedules.",
          ],
    });
  },
};
