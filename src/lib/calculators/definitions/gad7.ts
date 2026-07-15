import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

const gadOptions = [
  { label: "Not at all (0)", value: "0", points: 0 },
  { label: "Several days (1)", value: "1", points: 1 },
  { label: "More than half the days (2)", value: "2", points: 2 },
  { label: "Nearly every day (3)", value: "3", points: 3 },
];

const items = [
  { id: "nervous", label: "Feeling nervous, anxious, or on edge" },
  { id: "control", label: "Not being able to stop or control worrying" },
  { id: "worry", label: "Worrying too much about different things" },
  { id: "relax", label: "Trouble relaxing" },
  { id: "restless", label: "Being so restless that it is hard to sit still" },
  { id: "irritable", label: "Becoming easily annoyed or irritable" },
  { id: "afraid", label: "Feeling afraid as if something awful might happen" },
];

export const gad7: CalculatorDefinition = {
  slug: "gad-7",
  title: "GAD-7 Anxiety Scale",
  shortName: "GAD-7",
  description: "Seven-item measure of generalized anxiety symptom severity.",
  category: "mental-health",
  icon: "brain",
  clinicalApplication:
    "Screening and severity monitoring for anxiety symptoms. Not a standalone diagnosis.",
  evidence: {
    version: "GAD-7 (Spitzer/Kroenke)",
    intendedPopulation: "Adults in primary care or general medical settings for anxiety screening.",
    exclusions: [
      "Sole diagnostic instrument without clinical interview",
      "Acute panic/psychiatric emergency without safety assessment",
    ],
    references: [
      {
        title: "A brief measure for assessing generalized anxiety disorder: the GAD-7",
        citation: "Spitzer RL, et al. Arch Intern Med. 2006;166(10):1092–1097.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16717171/",
      },
      {
        title: "Anxiety disorders validation work with GAD-7",
        citation: "Kroenke K, et al. Ann Intern Med. 2007;146(5):317–325.",
        url: "https://pubmed.ncbi.nlm.nih.gov/17339617/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: items.map((item) => ({
    id: item.id,
    label: item.label,
    type: "select" as const,
    options: gadOptions,
  })),
  calculate: (values) => {
    const score = sumSelectPoints(
      values,
      items.map((item) => ({ id: item.id, options: gadOptions })),
    );
    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Minimal anxiety symptom band (0–4)";
    if (score >= 15) {
      severity = "severe";
      label = "Severe symptom band (15–21)";
    } else if (score >= 10) {
      severity = "high";
      label = "Moderate symptom band (10–14)";
    } else if (score >= 5) {
      severity = "moderate";
      label = "Mild symptom band (5–9)";
    }
    return scoreResult({
      score,
      maxScore: 21,
      label,
      severity,
      interpretation: `GAD-7 total ${score}/21.`,
      clinicalSignificance:
        "Higher scores indicate greater anxiety symptom burden and may warrant further assessment and support.",
      limitations:
        "Screens multiple anxiety presentations, not only GAD. Cultural and medical factors influence scores.",
      recommendations: [
        "Explore functional impact and coexisting depression (e.g. PHQ-9).",
        "Offer stepped-care psychological and medical options per local guidance.",
      ],
    });
  },
};
