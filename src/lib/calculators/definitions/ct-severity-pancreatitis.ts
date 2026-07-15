import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const ctSeverityPancreatitis: CalculatorDefinition = {
  slug: "ct-severity-pancreatitis",
  title: "CT Severity Index (Pancreatitis)",
  shortName: "CTSI",
  description:
    "Balthazar CT severity index combining pancreatic inflammation grade and necrosis extent.",
  category: "gastroenterology",
  icon: "stethoscope",
  clinicalApplication:
    "Radiologic severity discussion in acute pancreatitis after contrast CT when indicated.",
  evidence: {
    version: "Balthazar CTSI (0–10)",
    intendedPopulation: "Adults with acute pancreatitis undergoing CT severity grading.",
    exclusions: [
      "Early CT without clinical indication (imaging often deferred early)",
      "Non-contrast limited studies without necrosis assessment",
    ],
    references: [
      {
        title: "Acute pancreatitis: assessment of severity with clinical and CT evaluation",
        citation: "Balthazar EJ, et al. Radiology. 1990;174(2):331–336.",
        url: "https://pubmed.ncbi.nlm.nih.gov/2296641/",
      },
      {
        title: "Revised Atlanta classification context",
        citation: "Banks PA, et al. Gut. 2013;62(1):102–111.",
        url: "https://pubmed.ncbi.nlm.nih.gov/23100216/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "grade",
      label: "Balthazar grade (inflammation)",
      type: "select",
      options: [
        { label: "A — Normal pancreas (0)", value: "0", points: 0 },
        { label: "B — Focal/diffuse enlargement (1)", value: "1", points: 1 },
        { label: "C — Intrinsic abnormality + mild peripancreatic (2)", value: "2", points: 2 },
        { label: "D — Single fluid collection (3)", value: "3", points: 3 },
        { label: "E — ≥2 collections and/or gas (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "necrosis",
      label: "Necrosis",
      type: "select",
      options: [
        { label: "None (0)", value: "0", points: 0 },
        { label: "< 30% (2)", value: "2", points: 2 },
        { label: "30–50% (4)", value: "4", points: 4 },
        { label: "> 50% (6)", value: "6", points: 6 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, ctSeverityPancreatitis.inputs);
    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Mild CTSI band (0–3)";
    if (score >= 7) {
      severity = "severe";
      label = "Severe CTSI band (7–10)";
    } else if (score >= 4) {
      severity = "moderate";
      label = "Moderate CTSI band (4–6)";
    }
    return scoreResult({
      score,
      maxScore: 10,
      label,
      severity,
      interpretation: `CT severity index ${score}/10.`,
      clinicalSignificance:
        "Higher CTSI associates with higher morbidity; clinical organ failure remains central to severity.",
      limitations:
        "Morphologic severity may lag clinical status. Modified CTSI also exists.",
      recommendations:
        score >= 4
          ? [
              "Specialist review; monitor for infection/necrosis complications.",
              "Supportive care and nutrition planning; avoid early unnecessary necrosectomy.",
            ]
          : [
              "Continue standard care; image only when indicated.",
              "Reassess clinically for organ failure.",
            ],
    });
  },
};
