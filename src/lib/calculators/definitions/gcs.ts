import type { CalculatorDefinition, CalculatorResult } from "../types";

export const gcs: CalculatorDefinition = {
  slug: "gcs",
  title: "Glasgow Coma Scale",
  shortName: "GCS",
  description:
    "Standardised assessment of consciousness by evaluating eye, verbal, and motor responses after brain injury.",
  category: "neurology",
  icon: "🧠",
  clinicalApplication:
    "Used in acute settings (trauma, stroke, overdose) to quantify consciousness, guide intubation, and trend neurological status.",
  inputs: [
    {
      id: "eye",
      label: "Eye Opening",
      type: "select",
      options: [
        { label: "None", value: "1", points: 1 },
        { label: "To pain", value: "2", points: 2 },
        { label: "To speech", value: "3", points: 3 },
        { label: "Spontaneous", value: "4", points: 4 },
      ],
    },
    {
      id: "verbal",
      label: "Verbal Response",
      type: "select",
      options: [
        { label: "None", value: "1", points: 1 },
        { label: "Incomprehensible sounds", value: "2", points: 2 },
        { label: "Inappropriate words", value: "3", points: 3 },
        { label: "Confused", value: "4", points: 4 },
        { label: "Oriented", value: "5", points: 5 },
      ],
    },
    {
      id: "motor",
      label: "Motor Response",
      type: "select",
      options: [
        { label: "None", value: "1", points: 1 },
        { label: "Extension to pain", value: "2", points: 2 },
        { label: "Abnormal flexion to pain", value: "3", points: 3 },
        { label: "Withdraws from pain", value: "4", points: 4 },
        { label: "Localises pain", value: "5", points: 5 },
        { label: "Obeys commands", value: "6", points: 6 },
      ],
    },
  ],
  calculate: (values) => {
    const eye = Number(values.eye) || 1;
    const verbal = Number(values.verbal) || 1;
    const motor = Number(values.motor) || 1;
    const score = eye + verbal + motor;

    let severity: CalculatorResult["severity"] = "severe";
    let label = "Severe TBI";
    if (score >= 13) { severity = "low"; label = "Mild TBI"; }
    else if (score >= 9) { severity = "moderate"; label = "Moderate TBI"; }

    return {
      score,
      maxScore: 15,
      severity,
      label,
      interpretation: `GCS ${score}/15 (E${eye} V${verbal} M${motor}) — ${label}.`,
      clinicalSignificance:
        "GCS ≤8: severe injury — assess airway, call neurosurgery. GCS 9–12: moderate injury — close monitoring. GCS 13–15: mild injury — serial observations.",
      recommendations:
        score <= 8
          ? ["Assess airway — low threshold for intubation (GCS ≤8).", "Call neurosurgery and organise urgent CT head.", "Maintain spine precautions if trauma suspected, start ICP monitoring if indicated."]
          : score <= 12
            ? ["Admit to monitored bed (HDU/ICU) for close neurological observation.", "Repeat GCS hourly and report any drop of ≥2 points.", "CT head within 1 hour if not already done."]
            : ["Admit for observation — neurology/neurosurgery review.", "Perform CT head if not already done, especially if anticoagulated.", "Serial GCS observations every 2–4 hours for 24 hours."],
      limitations:
        "Less reliable in intubated/sedated patients, orbital trauma, or language barriers. FOUR score preferred in ICU.",
      details: [
        { label: "Eye Opening", value: `${eye}/4` },
        { label: "Verbal Response", value: `${verbal}/5` },
        { label: "Motor Response", value: `${motor}/6` },
      ],
    };
  },
};
