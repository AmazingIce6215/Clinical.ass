import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

const chance = [
  { label: "Would never doze (0)", value: "0", points: 0 },
  { label: "Slight chance (1)", value: "1", points: 1 },
  { label: "Moderate chance (2)", value: "2", points: 2 },
  { label: "High chance (3)", value: "3", points: 3 },
];

const situations = [
  { id: "sitting_reading", label: "Sitting and reading" },
  { id: "tv", label: "Watching TV" },
  { id: "public", label: "Sitting inactive in a public place" },
  { id: "passenger", label: "As a passenger in a car for an hour without a break" },
  { id: "afternoon", label: "Lying down to rest in the afternoon" },
  { id: "talking", label: "Sitting and talking to someone" },
  { id: "lunch", label: "Sitting quietly after lunch without alcohol" },
  { id: "traffic", label: "In a car, while stopped for a few minutes in traffic" },
];

export const epworth: CalculatorDefinition = {
  slug: "epworth",
  title: "Epworth Sleepiness Scale",
  shortName: "ESS",
  description:
    "Eight-item measure of daytime sleepiness propensity.",
  category: "pulmonology",
  icon: "air-vent",
  clinicalApplication:
    "Screens excessive daytime sleepiness; complements STOP-BANG for OSA pathways.",
  evidence: {
    version: "Epworth Sleepiness Scale (Johns)",
    intendedPopulation: "Adults evaluated for sleep disorders or daytime sleepiness.",
    exclusions: [
      "Sole diagnostic test for OSA",
      "Acute illness confounded by sedation",
    ],
    references: [
      {
        title: "A new method for measuring daytime sleepiness: the Epworth sleepiness scale",
        citation: "Johns MW. Sleep. 1991;14(6):540–545.",
        url: "https://pubmed.ncbi.nlm.nih.gov/1798888/",
      },
      {
        title: "Reliability and factor analysis of the Epworth Sleepiness Scale",
        citation: "Johns MW. Sleep. 1992;15(4):376–381.",
        url: "https://pubmed.ncbi.nlm.nih.gov/1519015/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: situations.map((s) => ({
    id: s.id,
    label: s.label,
    type: "select" as const,
    options: chance,
  })),
  calculate: (values) => {
    const score = sumSelectPoints(
      values,
      situations.map((s) => ({ id: s.id, options: chance })),
    );
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Normal daytime sleepiness band (0–10)";
    if (score >= 16) {
      severity = "high";
      label = "Severe excessive sleepiness band (16–24)";
    } else if (score >= 11) {
      severity = "moderate";
      label = "Excessive daytime sleepiness band (11–15)";
    }
    return scoreResult({
      score,
      maxScore: 24,
      label,
      severity,
      interpretation: `ESS ${score}/24.`,
      clinicalSignificance:
        "Scores ≥11 suggest excessive daytime sleepiness warranting sleep evaluation, especially with OSA risk factors.",
      limitations:
        "Self-report bias. Does not diagnose the cause of sleepiness.",
      recommendations:
        score >= 11
          ? [
              "Assess for OSA, narcolepsy, insufficient sleep, and sedating drugs.",
              "Advise against driving if sleepiness is significant until evaluated.",
            ]
          : [
              "Reassure if symptoms are minimal; still investigate if high clinical suspicion.",
              "Sleep hygiene counselling as appropriate.",
            ],
    });
  },
};
