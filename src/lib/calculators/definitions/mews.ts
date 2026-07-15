import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const mews: CalculatorDefinition = {
  slug: "mews",
  title: "Modified Early Warning Score (MEWS)",
  shortName: "MEWS",
  description:
    "Aggregates bedside vital-sign derangements to prompt earlier recognition of clinical deterioration.",
  category: "critical-care",
  icon: "hospital",
  clinicalApplication:
    "Educational early-warning example. Many hospitals use NEWS2 or local variants—follow local policy.",
  evidence: {
    version: "Common MEWS vital-sign banding (educational implementation)",
    intendedPopulation: "Hospitalised adults for bedside deterioration teaching.",
    exclusions: [
      "Replacement for institution-specific early warning systems (e.g. NEWS2)",
      "Paediatric patients",
      "Continuous monitored ICU settings with different escalation rules",
    ],
    references: [
      {
        title: "Validation of a modified Early Warning Score in medical admissions",
        citation: "Subbe CP, et al. QJM. 2001;94(10):521–526.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11588210/",
      },
      {
        title: "Early warning systems",
        citation: "NICE / local track-and-trigger guidance context.",
        url: "https://www.nice.org.uk/guidance/cg50",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "sbp",
      label: "Systolic BP (mmHg)",
      type: "select",
      options: [
        { label: "≤ 70 — 3 pts", value: "3a", points: 3 },
        { label: "71–80 — 2 pts", value: "2a", points: 2 },
        { label: "81–100 — 1 pt", value: "1a", points: 1 },
        { label: "101–199 — 0 pts", value: "0a", points: 0 },
        { label: "≥ 200 — 2 pts", value: "2b", points: 2 },
      ],
    },
    {
      id: "hr",
      label: "Heart rate (/min)",
      type: "select",
      options: [
        { label: "≤ 40 — 2 pts", value: "2a", points: 2 },
        { label: "41–50 — 1 pt", value: "1a", points: 1 },
        { label: "51–100 — 0 pts", value: "0", points: 0 },
        { label: "101–110 — 1 pt", value: "1b", points: 1 },
        { label: "111–129 — 2 pts", value: "2b", points: 2 },
        { label: "≥ 130 — 3 pts", value: "3", points: 3 },
      ],
    },
    {
      id: "rr",
      label: "Respiratory rate (/min)",
      type: "select",
      options: [
        { label: "< 9 — 2 pts", value: "2a", points: 2 },
        { label: "9–14 — 0 pts", value: "0", points: 0 },
        { label: "15–20 — 1 pt", value: "1", points: 1 },
        { label: "21–29 — 2 pts", value: "2b", points: 2 },
        { label: "≥ 30 — 3 pts", value: "3", points: 3 },
      ],
    },
    {
      id: "temp",
      label: "Temperature (°C)",
      type: "select",
      options: [
        { label: "< 35 — 2 pts", value: "2a", points: 2 },
        { label: "35–38.4 — 0 pts", value: "0", points: 0 },
        { label: "≥ 38.5 — 2 pts", value: "2b", points: 2 },
      ],
    },
    {
      id: "avpu",
      label: "AVPU",
      type: "select",
      options: [
        { label: "Alert — 0 pts", value: "0", points: 0 },
        { label: "Voice — 1 pt", value: "1", points: 1 },
        { label: "Pain — 2 pts", value: "2", points: 2 },
        { label: "Unresponsive — 3 pts", value: "3", points: 3 },
      ],
    },
  ],
  calculate: (values) => {
    const fields = [
      { id: "sbp", options: mews.inputs[0].options },
      { id: "hr", options: mews.inputs[1].options },
      { id: "rr", options: mews.inputs[2].options },
      { id: "temp", options: mews.inputs[3].options },
      { id: "avpu", options: mews.inputs[4].options },
    ];
    const score = sumSelectPoints(values, fields);
    let severity: "low" | "moderate" | "high" | "critical" = "low";
    let label = "Lower MEWS band";
    if (score >= 5) {
      severity = "critical";
      label = "Higher MEWS band — urgent review commonly required";
    } else if (score >= 3) {
      severity = "high";
      label = "Intermediate–high MEWS band";
    } else if (score >= 1) {
      severity = "moderate";
      label = "Mild vital-sign derangement band";
    }

    return scoreResult({
      score,
      maxScore: 14,
      label,
      severity,
      interpretation: `MEWS ${score} (educational banding).`,
      clinicalSignificance:
        "Higher scores correlate with increased risk of deterioration in derivation cohorts; escalation thresholds are local.",
      limitations:
        "Bandings differ between institutions. Oxygen requirement and other NEWS2 parameters are not included here.",
      recommendations:
        score >= 5
          ? [
              "Trigger urgent senior review per local track-and-trigger policy.",
              "Repeat observations frequently and consider critical-care outreach.",
            ]
          : [
              "Continue scheduled observations and reassess trends.",
              "Escalate earlier if clinician concern exceeds the score.",
            ],
    });
  },
};
