import type { CalculatorDefinition, CalculatorResult } from "../types";

export const gcs: CalculatorDefinition = {
  slug: "gcs",
  title: "Glasgow Coma Scale",
  shortName: "GCS",
  description:
    "Standardised assessment of consciousness by evaluating eye, verbal, and motor responses after brain injury.",
  category: "neurology",
  icon: "brain",
  clinicalApplication:
    "Supports standardised documentation and serial trending of consciousness in acute settings such as trauma, stroke, and overdose.",
  evidence: {
    version: "Standard 15-point adult scale",
    intendedPopulation:
      "Adults with acute impaired consciousness or suspected brain injury whose eye, verbal, and motor responses can be assessed.",
    exclusions: [
      "Sedation, paralysis, or intubation that prevents a complete assessment",
      "Preverbal children without use of an age-appropriate paediatric modification",
      "Local eye, facial, or limb injury that prevents reliable component testing",
    ],
    references: [
      {
        title: "Assessment of coma and impaired consciousness: a practical scale",
        citation: "Teasdale G, Jennett B. Lancet. 1974;2(7872):81–84.",
        url: "https://pubmed.ncbi.nlm.nih.gov/4136544/",
      },
      {
        title: "The Glasgow Coma Scale at 40 years: standing the test of time",
        citation: "Teasdale G, et al. Lancet Neurol. 2014;13(8):844–854.",
        url: "https://pubmed.ncbi.nlm.nih.gov/25030516/",
      },
    ],
    reviewedAt: "2026-07-14",
  },
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
        "Published severity bands commonly describe scores ≤8 as severe, 9–12 as moderate, and 13–15 as mild. The component scores, confounders, and change over time are more informative than a total score in isolation.",
      recommendations:
        score <= 8
          ? ["Urgent airway and ventilation assessment may be warranted; seek senior support and follow local airway protocols.", "Review the need for urgent neuroimaging and neurosurgical input.", "Maintain spinal precautions when trauma is suspected and consider intracranial-pressure monitoring under specialist guidance."]
          : score <= 12
            ? ["Consider monitored care and senior neurological review according to the overall presentation.", "Trend GCS at the interval defined by the local observation protocol and escalate a clinically important decline.", "Review indications and timing for CT head imaging under the applicable guideline."]
            : ["Consider observation and specialty review according to mechanism, symptoms, and risk factors.", "Review CT head criteria, including anticoagulation and other high-risk features.", "Use serial neurological observations at locally defined intervals."],
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
