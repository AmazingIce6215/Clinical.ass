import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const fourScore: CalculatorDefinition = {
  slug: "four-score",
  title: "FOUR Score",
  shortName: "FOUR",
  description:
    "Full Outline of UnResponsiveness score for neurological assessment, including brainstem reflexes and respiration.",
  category: "neurology",
  icon: "brain",
  clinicalApplication:
    "Complements or alternative to GCS in ICU neuro assessment, especially when verbal response is unavailable.",
  evidence: {
    version: "FOUR score (Wijdicks)",
    intendedPopulation: "Patients with impaired consciousness in critical care or emergency settings.",
    exclusions: [
      "Use without documented neurological exam skills",
      "Replacement for full neurological examination and imaging",
    ],
    references: [
      {
        title: "Validation of a new coma scale: the FOUR score",
        citation: "Wijdicks EFM, et al. Ann Neurol. 2005;58(4):585–593.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16178024/",
      },
      {
        title: "The FOUR score predicts outcome in patients after traumatic brain injury",
        citation: "Sadaka F, et al. Neurocrit Care. 2012;16(1):95–101.",
        url: "https://pubmed.ncbi.nlm.nih.gov/21826580/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "eye",
      label: "Eye response",
      type: "select",
      options: [
        { label: "Eyelids open or opened, tracking or blinking to command (4)", value: "4", points: 4 },
        { label: "Eyelids open but not tracking (3)", value: "3", points: 3 },
        { label: "Eyelids closed but open to loud voice (2)", value: "2", points: 2 },
        { label: "Eyelids closed but open to pain (1)", value: "1", points: 1 },
        { label: "Eyelids remain closed with pain (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "motor",
      label: "Motor response",
      type: "select",
      options: [
        { label: "Thumbs-up, fist, or peace sign (4)", value: "4", points: 4 },
        { label: "Localizing to pain (3)", value: "3", points: 3 },
        { label: "Flexion response to pain (2)", value: "2", points: 2 },
        { label: "Extension response to pain (1)", value: "1", points: 1 },
        { label: "No response or myoclonus status (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "brainstem",
      label: "Brainstem reflexes",
      type: "select",
      options: [
        { label: "Pupil and corneal reflexes present (4)", value: "4", points: 4 },
        { label: "One pupil wide and fixed (3)", value: "3", points: 3 },
        { label: "Pupil or corneal reflexes absent (2)", value: "2", points: 2 },
        { label: "Pupil and corneal reflexes absent (1)", value: "1", points: 1 },
        { label: "Absent pupil, corneal, and cough reflex (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "respiration",
      label: "Respiration",
      type: "select",
      options: [
        { label: "Not intubated, regular breathing (4)", value: "4", points: 4 },
        { label: "Not intubated, Cheyne–Stokes (3)", value: "3", points: 3 },
        { label: "Not intubated, irregular breathing (2)", value: "2", points: 2 },
        { label: "Breathes above ventilator rate (1)", value: "1", points: 1 },
        { label: "Breathes at ventilator rate or apnea (0)", value: "0", points: 0 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, fourScore.inputs);
    let severity: "low" | "moderate" | "high" | "critical" = "low";
    let label = "Higher responsiveness band";
    if (score <= 4) {
      severity = "critical";
      label = "Very low FOUR score band";
    } else if (score <= 8) {
      severity = "high";
      label = "Low FOUR score band";
    } else if (score <= 12) {
      severity = "moderate";
      label = "Intermediate FOUR score band";
    }
    return scoreResult({
      score,
      maxScore: 16,
      label,
      severity,
      interpretation: `FOUR score ${score}/16.`,
      clinicalSignificance:
        "Lower scores associate with higher mortality and poorer neurological outcomes in validation cohorts.",
      limitations:
        "Requires training for brainstem and respiratory components. Sedation and neuromuscular blockade confound scoring.",
      recommendations: [
        "Document each domain and trend scores over time.",
        "Integrate with imaging, EEG when indicated, and goals-of-care discussions.",
      ],
    });
  },
};
