import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const grace: CalculatorDefinition = {
  slug: "grace",
  title: "GRACE ACS Risk Score",
  shortName: "GRACE",
  description:
    "Global Registry of Acute Coronary Events score estimating in-hospital mortality risk in ACS.",
  category: "cardiology",
  icon: "activity",
  clinicalApplication:
    "Educational risk stratification in UA/NSTEMI/STEMI. Complements clinical judgment and local ACS pathways.",
  evidence: {
    version: "GRACE in-hospital mortality points model (educational implementation)",
    intendedPopulation: "Adults with acute coronary syndromes at hospital presentation.",
    exclusions: [
      "Non-ACS chest pain after evaluation",
      "Use as the sole determinant of invasive strategy timing",
    ],
    references: [
      {
        title: "Prediction of risk of death and myocardial infarction in the six months after presentation with ACS",
        citation: "Fox KAA, et al. BMJ. 2006;333(7578):1091.",
        url: "https://pubmed.ncbi.nlm.nih.gov/17032691/",
      },
      {
        title: "A validated prediction model for all forms of acute coronary syndrome",
        citation: "Eagle KA, et al. JAMA. 2004;291(22):2727–2733.",
        url: "https://pubmed.ncbi.nlm.nih.gov/15187054/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "age",
      label: "Age",
      type: "select",
      options: [
        { label: "< 30 (0)", value: "0", points: 0 },
        { label: "30–39 (8)", value: "8", points: 8 },
        { label: "40–49 (25)", value: "25", points: 25 },
        { label: "50–59 (41)", value: "41", points: 41 },
        { label: "60–69 (58)", value: "58", points: 58 },
        { label: "70–79 (75)", value: "75", points: 75 },
        { label: "80–89 (91)", value: "91", points: 91 },
        { label: "≥ 90 (100)", value: "100", points: 100 },
      ],
    },
    {
      id: "hr",
      label: "Heart rate",
      type: "select",
      options: [
        { label: "< 50 (0)", value: "0", points: 0 },
        { label: "50–69 (3)", value: "3", points: 3 },
        { label: "70–89 (9)", value: "9", points: 9 },
        { label: "90–109 (15)", value: "15", points: 15 },
        { label: "110–149 (24)", value: "24", points: 24 },
        { label: "150–199 (38)", value: "38", points: 38 },
        { label: "≥ 200 (46)", value: "46", points: 46 },
      ],
    },
    {
      id: "sbp",
      label: "Systolic BP",
      type: "select",
      options: [
        { label: "< 80 (58)", value: "58", points: 58 },
        { label: "80–99 (53)", value: "53", points: 53 },
        { label: "100–119 (43)", value: "43", points: 43 },
        { label: "120–139 (34)", value: "34", points: 34 },
        { label: "140–159 (24)", value: "24", points: 24 },
        { label: "160–199 (10)", value: "10", points: 10 },
        { label: "≥ 200 (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "creatinine",
      label: "Creatinine (mg/dL)",
      type: "select",
      options: [
        { label: "0–0.39 (1)", value: "1", points: 1 },
        { label: "0.4–0.79 (4)", value: "4", points: 4 },
        { label: "0.8–1.19 (7)", value: "7", points: 7 },
        { label: "1.2–1.59 (10)", value: "10", points: 10 },
        { label: "1.6–1.99 (13)", value: "13", points: 13 },
        { label: "2.0–3.99 (21)", value: "21", points: 21 },
        { label: "≥ 4.0 (28)", value: "28", points: 28 },
      ],
    },
    {
      id: "killip",
      label: "Killip class",
      type: "select",
      options: [
        { label: "I (0)", value: "0", points: 0 },
        { label: "II (20)", value: "20", points: 20 },
        { label: "III (39)", value: "39", points: 39 },
        { label: "IV (59)", value: "59", points: 59 },
      ],
    },
    { id: "arrest", label: "Cardiac arrest at admission (39)", type: "boolean" },
    { id: "st_dev", label: "ST-segment deviation (28)", type: "boolean" },
    { id: "enzymes", label: "Elevated cardiac enzymes/markers (14)", type: "boolean" },
  ],
  calculate: (values) => {
    const score =
      sumSelectPoints(values, [
        { id: "age", options: grace.inputs[0].options },
        { id: "hr", options: grace.inputs[1].options },
        { id: "sbp", options: grace.inputs[2].options },
        { id: "creatinine", options: grace.inputs[3].options },
        { id: "killip", options: grace.inputs[4].options },
      ]) +
      (values.arrest ? 39 : 0) +
      (values.st_dev ? 28 : 0) +
      (values.enzymes ? 14 : 0);

    let severity: "low" | "moderate" | "high" | "severe" | "critical" = "low";
    let label = "Lower GRACE band";
    if (score > 200) {
      severity = "critical";
      label = "Very high GRACE band";
    } else if (score > 140) {
      severity = "severe";
      label = "High GRACE band";
    } else if (score > 108) {
      severity = "high";
      label = "Intermediate–high GRACE band";
    } else if (score > 87) {
      severity = "moderate";
      label = "Intermediate GRACE band";
    }

    return scoreResult({
      score,
      maxScore: 372,
      label,
      severity,
      interpretation: `GRACE points ${score} (educational in-hospital model).`,
      clinicalSignificance:
        "Higher scores associate with higher short-term mortality in ACS registries; used to support early invasive strategy discussions in NSTE-ACS.",
      limitations:
        "Point tables approximate registry models. Absolute risks vary by era, therapy, and population.",
      recommendations: [
        "Integrate with ECG, troponin trajectory, and haemodynamics.",
        "Escalate monitoring and cardiology review as score and clinical risk rise.",
      ],
    });
  },
};
