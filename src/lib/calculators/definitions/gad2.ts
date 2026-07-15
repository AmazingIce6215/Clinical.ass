import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

const opts = [
  { label: "Not at all (0)", value: "0", points: 0 },
  { label: "Several days (1)", value: "1", points: 1 },
  { label: "More than half the days (2)", value: "2", points: 2 },
  { label: "Nearly every day (3)", value: "3", points: 3 },
];

export const gad2: CalculatorDefinition = {
  slug: "gad-2",
  title: "Generalized Anxiety Disorder 2 (GAD-2)",
  shortName: "GAD-2",
  description:
    "Two-item anxiety screen derived from GAD-7.",
  category: "mental-health",
  icon: "brain",
  clinicalApplication:
    "Brief anxiety screening; positive results should prompt GAD-7 or clinical assessment.",
  evidence: {
    version: "GAD-2 (Kroenke)",
    intendedPopulation: "Adults in primary care anxiety screening.",
    exclusions: [
      "Sole diagnostic tool",
      "Acute panic emergency without clinical evaluation",
    ],
    references: [
      {
        title: "Anxiety disorders in primary care: prevalence, impairment, comorbidity, and detection",
        citation: "Kroenke K, et al. Ann Intern Med. 2007;146(5):317–325.",
        url: "https://pubmed.ncbi.nlm.nih.gov/17339617/",
      },
      {
        title: "GAD-7 development",
        citation: "Spitzer RL, et al. Arch Intern Med. 2006;166(10):1092–1097.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16717171/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "nervous",
      label: "Feeling nervous, anxious, or on edge",
      type: "select",
      options: opts,
    },
    {
      id: "control",
      label: "Not being able to stop or control worrying",
      type: "select",
      options: opts,
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, [
      { id: "nervous", options: opts },
      { id: "control", options: opts },
    ]);
    const positive = score >= 3;
    return scoreResult({
      score,
      maxScore: 6,
      label: positive ? "Positive GAD-2 screen (≥3)" : "Negative GAD-2 screen",
      severity: positive ? "moderate" : "low",
      interpretation: `GAD-2 ${score}/6.`,
      clinicalSignificance:
        "Scores ≥3 suggest clinically significant anxiety symptoms warranting further assessment.",
      limitations:
        "Does not distinguish GAD from other anxiety disorders.",
      recommendations: positive
        ? ["Complete GAD-7 and assess functional impact.", "Explore coexisting depression and substance use."]
        : ["Routine counselling as indicated.", "Reassess if symptoms evolve."],
    });
  },
};
