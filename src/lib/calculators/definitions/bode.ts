import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const bode: CalculatorDefinition = {
  slug: "bode-index",
  title: "BODE Index (COPD)",
  shortName: "BODE",
  description:
    "Multidimensional COPD severity index: BMI, obstruction (FEV1), dyspnea, and exercise capacity.",
  category: "pulmonology",
  icon: "air-vent",
  clinicalApplication:
    "Prognostic discussion in stable COPD. Complements GOLD classification.",
  evidence: {
    version: "BODE index (Celli)",
    intendedPopulation: "Adults with COPD and available spirometry/6MWT/MMRC.",
    exclusions: [
      "Acute exacerbation without baseline data",
      "Inability to perform 6-minute walk without adaptation",
    ],
    references: [
      {
        title: "The body-mass index, airflow obstruction, dyspnea, and exercise capacity index in chronic obstructive pulmonary disease",
        citation: "Celli BR, et al. N Engl J Med. 2004;350(10):1005–1012.",
        url: "https://pubmed.ncbi.nlm.nih.gov/14999112/",
      },
      {
        title: "GOLD COPD strategy",
        citation: "Global Initiative for Chronic Obstructive Lung Disease.",
        url: "https://goldcopd.org/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "fev1",
      label: "FEV1 (% predicted)",
      type: "select",
      options: [
        { label: "≥ 65% (0)", value: "0", points: 0 },
        { label: "50–64% (1)", value: "1", points: 1 },
        { label: "36–49% (2)", value: "2", points: 2 },
        { label: "≤ 35% (3)", value: "3", points: 3 },
      ],
    },
    {
      id: "mmrc",
      label: "mMRC dyspnea",
      type: "select",
      options: [
        { label: "0–1 (0)", value: "0", points: 0 },
        { label: "2 (1)", value: "1", points: 1 },
        { label: "3 (2)", value: "2", points: 2 },
        { label: "4 (3)", value: "3", points: 3 },
      ],
    },
    {
      id: "distance",
      label: "6-minute walk distance",
      type: "select",
      options: [
        { label: "≥ 350 m (0)", value: "0", points: 0 },
        { label: "250–349 m (1)", value: "1", points: 1 },
        { label: "150–249 m (2)", value: "2", points: 2 },
        { label: "≤ 149 m (3)", value: "3", points: 3 },
      ],
    },
    {
      id: "bmi",
      label: "BMI",
      type: "select",
      options: [
        { label: "> 21 (0)", value: "0", points: 0 },
        { label: "≤ 21 (1)", value: "1", points: 1 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, bode.inputs);
    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Lower BODE quartile band (0–2)";
    if (score >= 7) {
      severity = "severe";
      label = "Highest BODE band (7–10)";
    } else if (score >= 5) {
      severity = "high";
      label = "Higher BODE band (5–6)";
    } else if (score >= 3) {
      severity = "moderate";
      label = "Intermediate BODE band (3–4)";
    }
    return scoreResult({
      score,
      maxScore: 10,
      label,
      severity,
      interpretation: `BODE index ${score}/10.`,
      clinicalSignificance:
        "Higher BODE scores associate with higher mortality in COPD cohorts and can support transplant/palliative discussions.",
      limitations:
        "Requires reliable spirometry and 6MWT. Exacerbation phenotype not fully captured.",
      recommendations: [
        "Optimise inhaled therapy, pulmonary rehab, and smoking cessation.",
        "Consider specialist referral as scores and symptoms rise.",
      ],
    });
  },
};
