import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const hit4ts: CalculatorDefinition = {
  slug: "hit-4ts",
  title: "HIT 4Ts Score",
  shortName: "4Ts",
  description:
    "Pre-test probability score for heparin-induced thrombocytopenia using Timing, Thrombocytopenia, Thrombosis, and oTher causes.",
  category: "hematology",
  icon: "droplets",
  clinicalApplication:
    "Guides whether to stop heparin and send HIT assays while arranging alternative anticoagulation.",
  evidence: {
    version: "4Ts score (Lo / Warkentin)",
    intendedPopulation: "Adults with thrombocytopenia during or after heparin exposure.",
    exclusions: [
      "Confirmed HIT diagnosis pathway already complete",
      "Children without specialist haematology input",
    ],
    references: [
      {
        title: "Evaluation of pretest clinical score (4 T's) for the diagnosis of HIT",
        citation: "Lo GK, et al. J Thromb Haemost. 2006;4(4):759–765.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16634744/",
      },
      {
        title: "ASH HIT guidelines",
        citation: "Cuker A, et al. Blood Adv. 2018;2(22):3360–3392.",
        url: "https://pubmed.ncbi.nlm.nih.gov/30482768/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "thrombocytopenia",
      label: "Thrombocytopenia",
      type: "select",
      options: [
        { label: "Platelet fall >50% and nadir ≥20 (2)", value: "2", points: 2 },
        { label: "Fall 30–50% or nadir 10–19 (1)", value: "1", points: 1 },
        { label: "Fall <30% or nadir <10 (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "timing",
      label: "Timing of platelet fall",
      type: "select",
      options: [
        { label: "Clear onset days 5–10 or ≤1 day with prior heparin ≤30 days (2)", value: "2", points: 2 },
        { label: "Consistent but not clear / onset after day 10 / ≤1 day with heparin 30–100 days ago (1)", value: "1", points: 1 },
        { label: "Fall ≤4 days without recent heparin (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "thrombosis",
      label: "Thrombosis or other sequelae",
      type: "select",
      options: [
        { label: "New thrombosis / skin necrosis / acute systemic reaction (2)", value: "2", points: 2 },
        { label: "Progressive/recurrent thrombosis / suspected thrombosis / erythematous skin lesions (1)", value: "1", points: 1 },
        { label: "None (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "other",
      label: "Other causes of thrombocytopenia",
      type: "select",
      options: [
        { label: "None apparent (2)", value: "2", points: 2 },
        { label: "Possible (1)", value: "1", points: 1 },
        { label: "Definite (0)", value: "0", points: 0 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, hit4ts.inputs);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Low probability (0–3)";
    if (score >= 6) {
      severity = "high";
      label = "High probability (6–8)";
    } else if (score >= 4) {
      severity = "moderate";
      label = "Intermediate probability (4–5)";
    }
    return scoreResult({
      score,
      maxScore: 8,
      label,
      severity,
      interpretation: `4Ts score ${score}/8 — ${label}.`,
      clinicalSignificance:
        "Low scores have high negative predictive value; intermediate/high scores warrant HIT laboratory testing and usually heparin cessation.",
      limitations:
        "Scoring is partly subjective. Do not delay care for life-threatening thrombosis.",
      recommendations:
        score <= 3
          ? [
              "HIT unlikely; investigate alternative causes of thrombocytopenia.",
              "Continue heparin only if still indicated and reassess if platelets fall further.",
            ]
          : [
              "Stop all heparin (including flushes); send HIT immunoassay ± functional assay per lab pathway.",
              "Start non-heparin anticoagulant if thrombosis risk warrants, with haematology input.",
            ],
    });
  },
};
