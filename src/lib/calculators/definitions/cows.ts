import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const cows: CalculatorDefinition = {
  slug: "cows",
  title: "COWS Opiate Withdrawal Scale",
  shortName: "COWS",
  description:
    "Clinical Opiate Withdrawal Scale for assessing opioid withdrawal severity.",
  category: "mental-health",
  icon: "pill",
  clinicalApplication:
    "Guides symptom-triggered assessment during opioid withdrawal and buprenorphine induction pathways.",
  evidence: {
    version: "COWS (Wesson & Ling) educational condensed item set",
    intendedPopulation: "Adults with opioid withdrawal in supervised settings.",
    exclusions: [
      "Unconscious patients",
      "Sole management without vital signs and safety assessment",
    ],
    references: [
      {
        title: "The Clinical Opiate Withdrawal Scale (COWS)",
        citation: "Wesson DR, Ling W. J Psychoactive Drugs. 2003;35(2):253–259.",
        url: "https://pubmed.ncbi.nlm.nih.gov/12924748/",
      },
      {
        title: "ASAM national practice guideline for opioid use disorder",
        citation: "ASAM. 2020 focused update.",
        url: "https://www.asam.org/quality-care/clinical-guidelines/national-practice-guideline",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "hr",
      label: "Resting pulse",
      type: "select",
      options: [
        { label: "≤ 80 (0)", value: "0", points: 0 },
        { label: "81–100 (1)", value: "1", points: 1 },
        { label: "101–120 (2)", value: "2", points: 2 },
        { label: "> 120 (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "sweating",
      label: "Sweating",
      type: "select",
      options: [
        { label: "No chills/flushing (0)", value: "0", points: 0 },
        { label: "Subjective chills/flushing (1)", value: "1", points: 1 },
        { label: "Flushed/moist face (2)", value: "2", points: 2 },
        { label: "Beads of sweat on brow (3)", value: "3", points: 3 },
        { label: "Sweat streaming (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "restlessness",
      label: "Restlessness",
      type: "select",
      options: [
        { label: "Able to sit still (0)", value: "0", points: 0 },
        { label: "Reports difficulty sitting still (1)", value: "1", points: 1 },
        { label: "Frequent shifting (3)", value: "3", points: 3 },
        { label: "Unable to sit still (5)", value: "5", points: 5 },
      ],
    },
    {
      id: "pupil",
      label: "Pupil size",
      type: "select",
      options: [
        { label: "Pinned or normal for room light (0)", value: "0", points: 0 },
        { label: "Possibly larger than normal (1)", value: "1", points: 1 },
        { label: "Moderately dilated (2)", value: "2", points: 2 },
        { label: "Only rim of iris visible (5)", value: "5", points: 5 },
      ],
    },
    {
      id: "aches",
      label: "Bone or joint aches",
      type: "select",
      options: [
        { label: "Not present (0)", value: "0", points: 0 },
        { label: "Mild diffuse discomfort (1)", value: "1", points: 1 },
        { label: "Severe diffuse aching (2)", value: "2", points: 2 },
        { label: "Patient rubbing joints/muscles and unable to sit still from discomfort (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "runny",
      label: "Runny nose or tearing (not from cold/allergy)",
      type: "select",
      options: [
        { label: "Not present (0)", value: "0", points: 0 },
        { label: "Nasal stuffiness or unusually moist eyes (1)", value: "1", points: 1 },
        { label: "Nose running or tearing (2)", value: "2", points: 2 },
        { label: "Nose constantly running or tears streaming (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "gi",
      label: "GI upset",
      type: "select",
      options: [
        { label: "No GI symptoms (0)", value: "0", points: 0 },
        { label: "Stomach cramps (1)", value: "1", points: 1 },
        { label: "Nausea or loose stool (2)", value: "2", points: 2 },
        { label: "Vomiting or diarrhea (3)", value: "3", points: 3 },
        { label: "Multiple episodes of vomiting/diarrhea (5)", value: "5", points: 5 },
      ],
    },
    {
      id: "tremor",
      label: "Tremor (outstretched hands)",
      type: "select",
      options: [
        { label: "No tremor (0)", value: "0", points: 0 },
        { label: "Tremor can be felt, not observed (1)", value: "1", points: 1 },
        { label: "Slight tremor observable (2)", value: "2", points: 2 },
        { label: "Gross tremor or muscle twitching (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "yawning",
      label: "Yawning",
      type: "select",
      options: [
        { label: "No yawning (0)", value: "0", points: 0 },
        { label: "Yawning once or twice during assessment (1)", value: "1", points: 1 },
        { label: "Yawning ≥3 times (2)", value: "2", points: 2 },
        { label: "Yawning several times/minute (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "anxiety",
      label: "Anxiety or irritability",
      type: "select",
      options: [
        { label: "None (0)", value: "0", points: 0 },
        { label: "Increasing irritability/anxiousness (1)", value: "1", points: 1 },
        { label: "Irritable/anxious (2)", value: "2", points: 2 },
        { label: "Difficult to participate due to irritability/anxiety (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "gooseflesh",
      label: "Gooseflesh skin",
      type: "select",
      options: [
        { label: "Smooth skin (0)", value: "0", points: 0 },
        { label: "Piloerection of skin can be felt or hairs standing up (3)", value: "3", points: 3 },
        { label: "Prominent piloerection (5)", value: "5", points: 5 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, cows.inputs);
    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Mild withdrawal band (5–12)";
    if (score >= 36) {
      severity = "severe";
      label = "Severe withdrawal band (≥36)";
    } else if (score >= 25) {
      severity = "high";
      label = "Moderately severe band (25–36)";
    } else if (score >= 13) {
      severity = "moderate";
      label = "Moderate band (13–24)";
    } else if (score < 5) {
      label = "Minimal / absent withdrawal band (<5)";
    }
    return scoreResult({
      score,
      maxScore: 48,
      label,
      severity,
      interpretation: `COWS ${score}.`,
      clinicalSignificance:
        "Many buprenorphine induction protocols wait for mild–moderate COWS thresholds to reduce precipitated withdrawal risk.",
      limitations:
        "This is an educational item set aligned with COWS domains; follow local full COWS form and protocol cut-offs.",
      recommendations:
        score >= 13
          ? [
              "Supportive care and symptom management; consider opioid agonist therapy pathways.",
              "Monitor vitals and offer addiction specialist input.",
            ]
          : [
              "Continue observation if induction is planned for higher scores.",
              "Address psychosocial support and overdose prevention (naloxone).",
            ],
    });
  },
};
