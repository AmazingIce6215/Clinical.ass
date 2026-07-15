import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const apgar: CalculatorDefinition = {
  slug: "apgar",
  title: "APGAR Score",
  shortName: "APGAR",
  description:
    "Rapid newborn assessment at 1 and 5 minutes based on Appearance, Pulse, Grimace, Activity, and Respiration.",
  category: "pediatrics",
  icon: "baby",
  clinicalApplication:
    "Educational neonatal scoring. Resuscitation decisions are based on clinical status, not waiting for APGAR tally alone.",
  evidence: {
    version: "Standard 10-point APGAR",
    intendedPopulation: "Newborns at 1 and 5 minutes of life (and later if indicated).",
    exclusions: [
      "Delayed scoring as a reason to withhold resuscitation",
      "Use as the sole predictor of long-term neurodevelopmental outcome",
    ],
    references: [
      {
        title: "A proposal for a new method of evaluation of the newborn infant",
        citation: "Apgar V. Curr Res Anesth Analg. 1953;32(4):260–267.",
        url: "https://pubmed.ncbi.nlm.nih.gov/13083014/",
      },
      {
        title: "The Apgar score (AAP/ACOG)",
        citation: "American Academy of Pediatrics Committee on Fetus and Newborn. Pediatrics. 2015;136(4):819–822.",
        url: "https://pubmed.ncbi.nlm.nih.gov/26416932/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "appearance",
      label: "Appearance (colour)",
      type: "select",
      options: [
        { label: "Blue/pale (0)", value: "0", points: 0 },
        { label: "Body pink, extremities blue (1)", value: "1", points: 1 },
        { label: "Completely pink (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "pulse",
      label: "Pulse",
      type: "select",
      options: [
        { label: "Absent (0)", value: "0", points: 0 },
        { label: "< 100/min (1)", value: "1", points: 1 },
        { label: "≥ 100/min (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "grimace",
      label: "Grimace (reflex irritability)",
      type: "select",
      options: [
        { label: "No response (0)", value: "0", points: 0 },
        { label: "Grimace (1)", value: "1", points: 1 },
        { label: "Cry or active withdrawal (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "activity",
      label: "Activity (muscle tone)",
      type: "select",
      options: [
        { label: "Limp (0)", value: "0", points: 0 },
        { label: "Some flexion (1)", value: "1", points: 1 },
        { label: "Active motion (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "respiration",
      label: "Respiration",
      type: "select",
      options: [
        { label: "Absent (0)", value: "0", points: 0 },
        { label: "Weak/irregular (1)", value: "1", points: 1 },
        { label: "Good/crying (2)", value: "2", points: 2 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, apgar.inputs);
    let severity: "low" | "moderate" | "high" | "critical" = "low";
    let label = "Reassuring band (7–10)";
    if (score <= 3) {
      severity = "critical";
      label = "Low APGAR band (0–3)";
    } else if (score <= 6) {
      severity = "high";
      label = "Moderately low band (4–6)";
    }
    return scoreResult({
      score,
      maxScore: 10,
      label,
      severity,
      interpretation: `APGAR ${score}/10.`,
      clinicalSignificance:
        "Describes transition after birth. Low scores prompt ongoing resuscitation and reassessment at 5–10–20 minutes as indicated.",
      limitations:
        "Influenced by prematurity, maternal drugs, and congenital conditions. Poor isolated predictor of cerebral palsy.",
      recommendations: [
        "Follow neonatal resuscitation algorithms based on breathing, tone, and heart rate.",
        "Document scores at standard time points and interventions performed.",
      ],
    });
  },
};
