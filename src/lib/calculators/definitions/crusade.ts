import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const crusade: CalculatorDefinition = {
  slug: "crusade",
  title: "CRUSADE Bleeding Risk Score",
  shortName: "CRUSADE",
  description:
    "Estimates in-hospital major bleeding risk in NSTE-ACS.",
  category: "cardiology",
  icon: "droplets",
  clinicalApplication:
    "Supports bleeding-risk discussion when choosing antithrombotic intensity in NSTE-ACS.",
  evidence: {
    version: "CRUSADE bleeding score (points model)",
    intendedPopulation: "Adults with NSTE-ACS.",
    exclusions: [
      "STEMI-only cohorts without adaptation",
      "Already major bleeding at presentation as sole focus",
    ],
    references: [
      {
        title: "Baseline risk of major bleeding in non-ST-segment-elevation myocardial infarction",
        citation: "Subherwal S, et al. Circulation. 2009;119(14):1873–1882.",
        url: "https://pubmed.ncbi.nlm.nih.gov/19332461/",
      },
      {
        title: "ESC NSTE-ACS guidelines bleeding risk context",
        citation: "Collet JP, et al. Eur Heart J. 2021;42(14):1289–1367.",
        url: "https://pubmed.ncbi.nlm.nih.gov/34447989/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "hct",
      label: "Baseline hematocrit (%)",
      type: "select",
      options: [
        { label: "≥ 40 (0)", value: "0", points: 0 },
        { label: "37–39.9 (2)", value: "2", points: 2 },
        { label: "34–36.9 (3)", value: "3", points: 3 },
        { label: "31–33.9 (7)", value: "7", points: 7 },
        { label: "< 31 (9)", value: "9", points: 9 },
      ],
    },
    {
      id: "crcl",
      label: "CrCl (mL/min)",
      type: "select",
      options: [
        { label: "> 120 (0)", value: "0", points: 0 },
        { label: "91–120 (7)", value: "7", points: 7 },
        { label: "61–90 (17)", value: "17", points: 17 },
        { label: "31–60 (28)", value: "28", points: 28 },
        { label: "15–30 (35)", value: "35", points: 35 },
        { label: "≤ 15 (39)", value: "39", points: 39 },
      ],
    },
    {
      id: "hr",
      label: "Heart rate",
      type: "select",
      options: [
        { label: "≤ 70 (0)", value: "0", points: 0 },
        { label: "71–80 (1)", value: "1", points: 1 },
        { label: "81–90 (3)", value: "3", points: 3 },
        { label: "91–100 (6)", value: "6", points: 6 },
        { label: "101–110 (8)", value: "8", points: 8 },
        { label: "111–120 (10)", value: "10", points: 10 },
        { label: "≥ 121 (11)", value: "11", points: 11 },
      ],
    },
    {
      id: "sex",
      label: "Sex",
      type: "select",
      options: [
        { label: "Male (0)", value: "0", points: 0 },
        { label: "Female (8)", value: "8", points: 8 },
      ],
    },
    {
      id: "signs_hf",
      label: "Signs of HF at presentation",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (7)", value: "7", points: 7 },
      ],
    },
    {
      id: "prior_vascular",
      label: "Prior vascular disease",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (6)", value: "6", points: 6 },
      ],
    },
    {
      id: "diabetes",
      label: "Diabetes mellitus",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (6)", value: "6", points: 6 },
      ],
    },
    {
      id: "sbp",
      label: "Systolic BP",
      type: "select",
      options: [
        { label: "≤ 90 (10)", value: "10", points: 10 },
        { label: "91–100 (8)", value: "8", points: 8 },
        { label: "101–120 (5)", value: "5", points: 5 },
        { label: "121–180 (1)", value: "1", points: 1 },
        { label: "181–200 (3)", value: "3", points: 3 },
        { label: "≥ 201 (5)", value: "5b", points: 5 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, crusade.inputs);
    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Lower CRUSADE bleeding band (≤20)";
    if (score > 50) {
      severity = "severe";
      label = "Very high bleeding band (>50)";
    } else if (score > 40) {
      severity = "high";
      label = "High bleeding band (41–50)";
    } else if (score > 30) {
      severity = "high";
      label = "Moderate–high band (31–40)";
    } else if (score > 20) {
      severity = "moderate";
      label = "Intermediate band (21–30)";
    }
    return scoreResult({
      score,
      maxScore: 100,
      label,
      severity,
      interpretation: `CRUSADE score ${score}.`,
      clinicalSignificance:
        "Higher scores associate with higher major bleeding rates on antithrombotic therapy in NSTE-ACS registries.",
      limitations:
        "Does not replace procedural bleeding risk assessment or individual drug choices.",
      recommendations: [
        "Balance ischaemic (e.g. GRACE/TIMI) and bleeding risk when choosing therapy.",
        "Use renal-adjusted dosing and radial access strategies when appropriate.",
      ],
    });
  },
};
