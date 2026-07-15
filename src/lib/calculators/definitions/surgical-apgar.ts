import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const surgicalApgar: CalculatorDefinition = {
  slug: "surgical-apgar",
  title: "Surgical Apgar Score",
  shortName: "SAS",
  description:
    "Intraoperative score from blood loss, lowest MAP, and lowest HR predicting postoperative risk.",
  category: "surgery",
  icon: "hospital",
  clinicalApplication:
    "Postoperative risk communication after major surgery using intraoperative physiology.",
  evidence: {
    version: "Surgical Apgar Score (Gawande)",
    intendedPopulation: "Adults after major surgery with recorded EBL, MAP, and HR.",
    exclusions: [
      "Minor ambulatory procedures without meaningful score interpretation",
      "Missing intraoperative data",
    ],
    references: [
      {
        title: "An Apgar score for surgery",
        citation: "Gawande AA, et al. J Am Coll Surg. 2007;204(2):201–208.",
        url: "https://pubmed.ncbi.nlm.nih.gov/17254923/",
      },
      {
        title: "Validation of the surgical Apgar score",
        citation: "Regenbogen SE, et al. Arch Surg. 2009.",
        url: "https://pubmed.ncbi.nlm.nih.gov/19221322/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "ebl",
      label: "Estimated blood loss",
      type: "select",
      options: [
        { label: "≤ 100 mL (3)", value: "3", points: 3 },
        { label: "101–600 mL (2)", value: "2", points: 2 },
        { label: "601–1000 mL (1)", value: "1", points: 1 },
        { label: "> 1000 mL (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "map",
      label: "Lowest mean arterial pressure",
      type: "select",
      options: [
        { label: "≥ 70 mmHg (3)", value: "3", points: 3 },
        { label: "55–69 (2)", value: "2", points: 2 },
        { label: "40–54 (1)", value: "1", points: 1 },
        { label: "< 40 (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "hr",
      label: "Lowest heart rate",
      type: "select",
      options: [
        { label: "≤ 55 (4)", value: "4", points: 4 },
        { label: "56–65 (3)", value: "3", points: 3 },
        { label: "66–75 (2)", value: "2", points: 2 },
        { label: "76–85 (1)", value: "1", points: 1 },
        { label: "> 85 (0)", value: "0", points: 0 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, surgicalApgar.inputs);
    let severity: "low" | "moderate" | "high" | "critical" = "low";
    let label = "Higher Surgical Apgar band (better)";
    if (score <= 4) {
      severity = "critical";
      label = "Low Surgical Apgar band — higher complication risk";
    } else if (score <= 6) {
      severity = "high";
      label = "Intermediate–low band";
    } else if (score <= 8) {
      severity = "moderate";
      label = "Intermediate band";
    }
    return scoreResult({
      score,
      maxScore: 10,
      label,
      severity,
      interpretation: `Surgical Apgar score ${score}/10.`,
      clinicalSignificance:
        "Lower scores associate with higher major complication and mortality risk after major surgery.",
      limitations:
        "Does not replace comprehensive postoperative risk assessment or frailty tools.",
      recommendations:
        score <= 6
          ? [
              "Heightened postoperative monitoring and senior review.",
              "Optimise fluid, transfusion, and complication surveillance.",
            ]
          : [
              "Continue standard postoperative pathways with usual vigilance.",
              "Document intraoperative values used for the score.",
            ],
    });
  },
};
