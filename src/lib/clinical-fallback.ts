import type { DiagnosisResult, PatientCase } from "./types";

export function getFallbackDiagnosis(patientCase: PatientCase): DiagnosisResult {
  const complaints = patientCase.chiefComplaints.join(", ") || "unspecified symptoms";

  return {
    primaryDiagnosis: "Requires clinical correlation — add GROQ_API_KEY for AI diagnosis",
    clinicalReasoningSummary: `Based on ${complaints} in a ${patientCase.age ?? "?"}-year-old patient, further correlation is needed.`,
    differentials: [
      {
        diagnosis: "Common benign cause related to presentation",
        likelihood: "moderate",
        reasoning: `Typical for ${complaints}.`,
        whyNotPrimary: "Insufficient data to confirm.",
        keyFeatures: ["Presentation fits common pattern"],
      },
      {
        diagnosis: "Serious pathology to exclude",
        likelihood: "low",
        reasoning: "Always consider red-flag diagnoses.",
        whyNotPrimary: "No red flags documented yet.",
        keyFeatures: ["Needs exclusion"],
      },
    ],
    redFlags: [
      { flag: "Sudden severe symptoms", whyItMatters: "May indicate life-threatening pathology" },
      { flag: "Altered consciousness", whyItMatters: "Requires urgent assessment" },
    ],
    investigations: patientCase.investigations.length
      ? patientCase.investigations
      : ["CBC", "Basic metabolic panel", "Targeted imaging as indicated"],
    management: [
      "Stabilize ABCs if needed",
      "Treat based on most likely diagnosis",
      "Reassess after investigation results",
      "Senior review for complex cases",
    ],
    teachingPoints: [
      "Construct a prioritized differential before ordering tests.",
      "Add GROQ_API_KEY to enable AI-powered reasoning.",
    ],
  };
}
