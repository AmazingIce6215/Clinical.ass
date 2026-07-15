import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

const n01234567 = (labels: string[]) =>
  labels.map((label, i) => ({ label: `${label} (${i})`, value: String(i), points: i }));

export const ciwaAr: CalculatorDefinition = {
  slug: "ciwa-ar",
  title: "CIWA-Ar Alcohol Withdrawal",
  shortName: "CIWA-Ar",
  description:
    "Clinical Institute Withdrawal Assessment for Alcohol, revised — symptom-triggered withdrawal severity.",
  category: "mental-health",
  icon: "pill",
  clinicalApplication:
    "Guides symptom-triggered benzodiazepine protocols for alcohol withdrawal in supervised settings.",
  evidence: {
    version: "CIWA-Ar 10-item scale (max 67)",
    intendedPopulation: "Adults with known or suspected alcohol withdrawal in monitored care.",
    exclusions: [
      "Unconscious patients who cannot report symptoms",
      "Sole tool without vital-sign and medical assessment",
      "Other sedative withdrawal without clinical adaptation",
    ],
    references: [
      {
        title: "Assessment of alcohol withdrawal: the revised Clinical Institute Withdrawal Assessment for Alcohol scale (CIWA-Ar)",
        citation: "Sullivan JT, et al. Br J Addict. 1989;84(11):1353–1357.",
        url: "https://pubmed.ncbi.nlm.nih.gov/2597811/",
      },
      {
        title: "ASAM alcohol withdrawal management guidelines",
        citation: "The ASAM Clinical Practice Guideline on Alcohol Withdrawal Management. 2020.",
        url: "https://www.asam.org/quality-care/clinical-guidelines/alcohol-withdrawal-management-guideline",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "nausea",
      label: "Nausea and vomiting",
      type: "select",
      options: n01234567([
        "None",
        "Mild nausea, no vomiting",
        "Intermittent nausea",
        "Intermittent nausea",
        "Intermittent nausea with dry heaves",
        "Intermittent nausea with dry heaves",
        "Intermittent nausea with dry heaves",
        "Constant nausea, frequent dry heaves/vomiting",
      ]),
    },
    {
      id: "tremor",
      label: "Tremor (arms extended)",
      type: "select",
      options: n01234567([
        "No tremor",
        "Not visible but can be felt fingertip to fingertip",
        "Mild",
        "Mild–moderate",
        "Moderate with arms extended",
        "Moderate–severe",
        "Severe",
        "Severe, even with arms not extended",
      ]),
    },
    {
      id: "sweats",
      label: "Paroxysmal sweats",
      type: "select",
      options: n01234567([
        "No sweat visible",
        "Barely perceptible sweating, palms moist",
        "Beads of sweat obvious on forehead",
        "Beads of sweat obvious on forehead",
        "Beads of sweat obvious on forehead",
        "Beads of sweat obvious on forehead",
        "Beads of sweat obvious on forehead",
        "Drenching sweats",
      ]),
    },
    {
      id: "anxiety",
      label: "Anxiety",
      type: "select",
      options: n01234567([
        "No anxiety, at ease",
        "Mildly anxious",
        "Moderately anxious",
        "Moderately anxious / guarded",
        "Moderately anxious / guarded",
        "Moderately anxious / guarded",
        "Moderately anxious / guarded",
        "Equivalent to acute panic states",
      ]),
    },
    {
      id: "agitation",
      label: "Agitation",
      type: "select",
      options: n01234567([
        "Normal activity",
        "Somewhat more than normal activity",
        "Moderately fidgety/restless",
        "Moderately fidgety/restless",
        "Moderately fidgety/restless",
        "Moderately fidgety/restless",
        "Moderately fidgety/restless",
        "Paces or constantly thrashes about",
      ]),
    },
    {
      id: "tactile",
      label: "Tactile disturbances",
      type: "select",
      options: n01234567([
        "None",
        "Very mild itching, pins & needles, burning, or numbness",
        "Mild itching/pins & needles/burning/numbness",
        "Moderate itching/pins & needles/burning/numbness",
        "Moderately severe hallucinations",
        "Severe hallucinations",
        "Extremely severe hallucinations",
        "Continuous hallucinations",
      ]),
    },
    {
      id: "auditory",
      label: "Auditory disturbances",
      type: "select",
      options: n01234567([
        "Not present",
        "Very mild harshness or ability to frighten",
        "Mild harshness or ability to frighten",
        "Moderate harshness or ability to frighten",
        "Moderately severe hallucinations",
        "Severe hallucinations",
        "Extremely severe hallucinations",
        "Continuous hallucinations",
      ]),
    },
    {
      id: "visual",
      label: "Visual disturbances",
      type: "select",
      options: n01234567([
        "Not present",
        "Very mild sensitivity",
        "Mild sensitivity",
        "Moderate sensitivity",
        "Moderately severe hallucinations",
        "Severe hallucinations",
        "Extremely severe hallucinations",
        "Continuous hallucinations",
      ]),
    },
    {
      id: "headache",
      label: "Headache / fullness in head",
      type: "select",
      options: n01234567([
        "Not present",
        "Very mild",
        "Mild",
        "Moderate",
        "Moderately severe",
        "Severe",
        "Very severe",
        "Extremely severe",
      ]),
    },
    {
      id: "orientation",
      label: "Orientation and clouding of sensorium",
      type: "select",
      options: [
        { label: "Oriented, can do serial additions (0)", value: "0", points: 0 },
        { label: "Cannot do serial additions or uncertain about date (1)", value: "1", points: 1 },
        { label: "Disoriented for date by ≤2 days (2)", value: "2", points: 2 },
        { label: "Disoriented for date by >2 days (3)", value: "3", points: 3 },
        { label: "Disoriented for place and/or person (4)", value: "4", points: 4 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, ciwaAr.inputs);
    let severity: "low" | "moderate" | "high" | "severe" | "critical" = "low";
    let label = "Minimal–mild withdrawal band (<10)";
    if (score >= 20) {
      severity = "critical";
      label = "Severe withdrawal band (≥20)";
    } else if (score >= 15) {
      severity = "severe";
      label = "Moderately severe band (15–19)";
    } else if (score >= 10) {
      severity = "high";
      label = "Moderate band (10–14)";
    } else if (score >= 8) {
      severity = "moderate";
      label = "Mild–moderate band (8–9)";
    }
    return scoreResult({
      score,
      maxScore: 67,
      label,
      severity,
      interpretation: `CIWA-Ar ${score}/67.`,
      clinicalSignificance:
        "Many protocols dose benzodiazepines when CIWA-Ar is ≥8–10 and intensify care at higher scores; always follow local policy.",
      limitations:
        "Subjective items. Medical mimics (sepsis, hepatic encephalopathy, trauma) can inflate scores.",
      recommendations:
        score >= 15
          ? [
              "Urgent medical review; symptom-triggered benzos per protocol; consider HDU.",
              "Monitor vitals, glucose, electrolytes; thiamine before glucose if risk of Wernicke.",
            ]
          : score >= 8
            ? [
                "Start/continue symptom-triggered protocol and frequent reassessments.",
                "Give thiamine, folate, multivitamins as indicated; ensure safe environment.",
              ]
            : [
                "Continue observation and supportive care.",
                "Reassess regularly — scores can rise in the first 48–72 hours.",
              ],
    });
  },
};
