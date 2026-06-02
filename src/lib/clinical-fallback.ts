import type { ClinicalStepResponse, DiagnosisResult, PatientCase } from "./types";

const HPI_STEPS: Omit<ClinicalStepResponse, "workingDifferentials" | "missingCritical">[] = [
  {
    nextStep: "hpi_onset",
    question: "When did the symptoms start?",
    inputType: "chips",
    options: ["Today", "1–3 days ago", "4–7 days ago", "More than 1 week"],
    allowCustom: true,
    fieldKey: "onset",
    category: "hpi",
    teachingPearl: "Onset helps distinguish acute from chronic pathology.",
  },
  {
    nextStep: "hpi_severity",
    question: "How severe are the symptoms?",
    inputType: "chips",
    options: ["Mild", "Moderate", "Severe", "Life-threatening"],
    fieldKey: "severity",
    category: "hpi",
  },
  {
    nextStep: "hpi_associated",
    question: "Any associated symptoms?",
    inputType: "multiselect",
    options: ["Fever", "Nausea", "Vomiting", "Weight loss", "Night sweats", "None"],
    allowCustom: true,
    fieldKey: "associated",
    category: "hpi",
  },
  {
    nextStep: "hpi_pmh",
    question: "Relevant past medical history?",
    inputType: "multiselect",
    options: ["Diabetes", "Hypertension", "Asthma", "Heart disease", "None"],
    allowCustom: true,
    fieldKey: "pmh",
    category: "hpi",
  },
];

const EXAM_STEPS: Omit<ClinicalStepResponse, "workingDifferentials" | "missingCritical">[] = [
  {
    nextStep: "exam_general",
    question: "General examination findings?",
    inputType: "multiselect",
    options: ["Well", "Ill-looking", "Febrile", "Pallor", "Cyanosis", "Dehydrated"],
    allowCustom: true,
    fieldKey: "general",
    category: "exam",
  },
  {
    nextStep: "exam_focused",
    question: "Focused examination findings?",
    inputType: "text",
    fieldKey: "focused",
    category: "exam",
    teachingPearl: "Document positive and pertinent negative findings.",
  },
];

export function getFallbackStep(
  patientCase: PatientCase,
  stepIndex: number,
): ClinicalStepResponse {
  const allSteps = [...HPI_STEPS, ...EXAM_STEPS];
  const step = allSteps[stepIndex];

  if (!step) {
    return {
      nextStep: "investigations",
      question: "Which investigations would you order?",
      inputType: "multiselect",
      options: ["CBC", "CRP", "Chest X-ray", "U&E", "LFTs", "Blood culture", "ECG", "Urinalysis"],
      allowCustom: true,
      fieldKey: "ordered",
      category: "investigations",
      workingDifferentials: inferDifferentials(patientCase),
    };
  }

  return {
    ...step,
    workingDifferentials: inferDifferentials(patientCase),
    missingCritical: getMissingFields(patientCase),
  };
}

export function isFlowComplete(patientCase: PatientCase, stepIndex: number): boolean {
  const hpiExamCount = HPI_STEPS.length + EXAM_STEPS.length;
  return stepIndex >= hpiExamCount + 1;
}

export function getFallbackDiagnosis(patientCase: PatientCase): DiagnosisResult {
  const complaints = patientCase.chiefComplaints.join(", ") || "unspecified symptoms";

  return {
    primaryDiagnosis: "Requires clinical correlation — insufficient data for definitive diagnosis",
    differentials: [
      {
        diagnosis: "Common benign cause related to presentation",
        likelihood: "moderate",
        reasoning: `Based on ${complaints} in a ${patientCase.age ?? "?"}-year-old patient.`,
      },
      {
        diagnosis: "Serious pathology to exclude",
        likelihood: "low-moderate",
        reasoning: "Always consider red-flag diagnoses based on presentation.",
      },
    ],
    redFlags: ["Sudden severe symptoms", "Altered consciousness", "Hemodynamic instability"],
    investigations: patientCase.investigations.length
      ? patientCase.investigations
      : ["CBC", "Basic metabolic panel", "Targeted imaging as indicated"],
    management: [
      "Stabilize ABCs if needed",
      "Treat empirically based on most likely diagnosis",
      "Reassess after investigation results",
      "Senior review for complex cases",
    ],
    teachingPoints: [
      "Always construct a prioritized differential before ordering tests.",
      "Add GROQ_API_KEY to enable AI-powered reasoning.",
    ],
  };
}

function inferDifferentials(patientCase: PatientCase) {
  const cc = patientCase.chiefComplaints.map((c) => c.toLowerCase());
  const diffs: ClinicalStepResponse["workingDifferentials"] = [];

  if (cc.some((c) => c.includes("fever") || c.includes("cough"))) {
    diffs.push({ diagnosis: "Viral URTI", likelihood: "high" });
    diffs.push({ diagnosis: "Pneumonia", likelihood: "moderate" });
  }
  if (cc.some((c) => c.includes("chest pain"))) {
    diffs.push({ diagnosis: "Musculoskeletal pain", likelihood: "moderate" });
    diffs.push({ diagnosis: "ACS", likelihood: "moderate" });
  }
  if (cc.some((c) => c.includes("abdominal") || c.includes("pain"))) {
    diffs.push({ diagnosis: "Gastroenteritis", likelihood: "moderate" });
    diffs.push({ diagnosis: "Appendicitis", likelihood: "low" });
  }
  if (diffs.length === 0) {
    diffs.push({ diagnosis: "Further history needed", likelihood: "high" });
  }
  return diffs;
}

function getMissingFields(patientCase: PatientCase): string[] {
  const missing: string[] = [];
  if (!patientCase.age) missing.push("age");
  if (patientCase.chiefComplaints.length === 0) missing.push("chief complaint");
  if (!patientCase.history.onset) missing.push("onset");
  return missing;
}
