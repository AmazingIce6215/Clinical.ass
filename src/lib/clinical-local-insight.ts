import { diagnosisToInsight } from "./clinical-ai";
import type { ClinicalAiInsight, DiagnosisResult, PatientCase } from "./types";

type FallbackReason = "rate_limit" | "missing_key" | "generic";

const COMPLAINT_PROFILES: Array<{
  match: RegExp;
  leading: string;
  differentials: Array<{ name: string; likelihood: "high" | "moderate" | "low"; reasoning: string }>;
  investigations: string[];
  redFlags: Array<{ flag: string; whyItMatters: string }>;
}> = [
  {
    match: /abdominal|stomach|belly|nausea|vomit/i,
    leading: "Acute gastroenteritis vs surgical abdomen",
    differentials: [
      { name: "Acute gastroenteritis", likelihood: "high", reasoning: "Common with abdominal pain and vomiting." },
      { name: "Appendicitis", likelihood: "moderate", reasoning: "Must exclude focal peritonism and progression." },
      { name: "Pancreatitis", likelihood: "low", reasoning: "Consider with epigastric pain or alcohol history." },
    ],
    investigations: ["CBC", "CRP", "U&E", "LFTs", "Urinalysis", "Abdominal imaging if red flags"],
    redFlags: [
      { flag: "Rigid abdomen or rebound", whyItMatters: "Suggests surgical emergency" },
      { flag: "Haemodynamic instability", whyItMatters: "Needs urgent resuscitation and senior review" },
    ],
  },
  {
    match: /chest pain/i,
    leading: "Chest pain — cardiac vs non-cardiac",
    differentials: [
      { name: "Acute coronary syndrome", likelihood: "moderate", reasoning: "Always consider in chest pain workups." },
      { name: "GERD / musculoskeletal pain", likelihood: "high", reasoning: "Common benign mimics in younger patients." },
      { name: "Pulmonary embolism", likelihood: "low", reasoning: "Consider with dyspnoea, tachycardia, or risk factors." },
    ],
    investigations: ["ECG", "Troponin", "Chest X-ray", "D-dimer if PE suspected"],
    redFlags: [
      { flag: "Diaphoresis with crushing pain", whyItMatters: "Raises concern for ACS" },
      { flag: "Hypoxia or tachycardia", whyItMatters: "Consider PE or serious cardiopulmonary disease" },
    ],
  },
  {
    match: /fever/i,
    leading: "Fever — infection workup",
    differentials: [
      { name: "Viral upper respiratory infection", likelihood: "high", reasoning: "Most common cause of undifferentiated fever." },
      { name: "Urinary tract infection", likelihood: "moderate", reasoning: "Common and treatable source to exclude." },
      { name: "Sepsis of unknown source", likelihood: "low", reasoning: "Consider if unwell or haemodynamically compromised." },
    ],
    investigations: ["CBC", "CRP", "Blood cultures if unwell", "Urinalysis", "Chest X-ray if respiratory symptoms"],
    redFlags: [
      { flag: "Rigors with hypotension", whyItMatters: "May indicate sepsis" },
      { flag: "Altered mental status", whyItMatters: "Needs urgent assessment" },
    ],
  },
  {
    match: /headache/i,
    leading: "Headache — primary vs secondary cause",
    differentials: [
      { name: "Tension-type or migraine headache", likelihood: "high", reasoning: "Most headaches in young adults are benign." },
      { name: "Meningitis", likelihood: "low", reasoning: "Exclude fever, neck stiffness, photophobia." },
      { name: "Subarachnoid haemorrhage", likelihood: "low", reasoning: "Consider thunderclap onset or neurological signs." },
    ],
    investigations: ["Neurological exam", "CT head if red flags", "LP if meningitis suspected"],
    redFlags: [
      { flag: "Sudden worst headache of life", whyItMatters: "Possible subarachnoid haemorrhage" },
      { flag: "Fever with neck stiffness", whyItMatters: "Possible meningitis" },
    ],
  },
  {
    match: /shortness of breath|breathless|sob/i,
    leading: "Dyspnoea — cardiopulmonary assessment",
    differentials: [
      { name: "Asthma / COPD exacerbation", likelihood: "high", reasoning: "Common reversible airway disease presentation." },
      { name: "Heart failure", likelihood: "moderate", reasoning: "Consider orthopnoea, oedema, or cardiac history." },
      { name: "Pulmonary embolism", likelihood: "low", reasoning: "Consider pleuritic pain, tachycardia, or immobility." },
    ],
    investigations: ["SpO₂", "Chest X-ray", "ECG", "ABG or VBG if severe", "D-dimer / CTPA if indicated"],
    redFlags: [
      { flag: "SpO₂ < 92% on room air", whyItMatters: "May need supplemental oxygen or escalation" },
      { flag: "Silent chest or exhaustion", whyItMatters: "Suggests impending respiratory failure" },
    ],
  },
];

function matchProfile(complaints: string[]) {
  const text = complaints.join(" ").toLowerCase();
  return COMPLAINT_PROFILES.find((profile) => profile.match.test(text));
}

function buildProfileDiagnosis(patientCase: PatientCase): DiagnosisResult {
  const profile = matchProfile(patientCase.chiefComplaints);
  const complaints = patientCase.chiefComplaints.join(", ") || "presenting symptoms";
  const age = patientCase.age ?? "?";

  if (!profile) {
    return {
      primaryDiagnosis: "Undifferentiated presentation — correlate clinically",
      clinicalReasoningSummary: `Based on ${complaints} in a ${age}-year-old patient, build a prioritized differential and targeted workup.`,
      differentials: [
        {
          diagnosis: "Most likely benign cause",
          likelihood: "moderate",
          reasoning: `Fits the pattern of ${complaints}.`,
          whyNotPrimary: "Needs confirmation with history and exam.",
          keyFeatures: ["Symptom pattern", "Risk factors", "Exam findings"],
        },
        {
          diagnosis: "Important serious diagnosis to exclude",
          likelihood: "low",
          reasoning: "Always rule out red-flag pathology.",
          whyNotPrimary: "No definitive supporting features yet.",
          keyFeatures: ["Red flags absent or present"],
        },
      ],
      redFlags: [
        { flag: "Sudden severe symptoms", whyItMatters: "May indicate life-threatening pathology" },
        { flag: "Haemodynamic instability", whyItMatters: "Requires urgent assessment" },
      ],
      investigations: patientCase.investigations.length
        ? patientCase.investigations
        : ["Focused labs", "Targeted imaging", "Bedside observations"],
      management: [
        "Assess ABCs and vital signs",
        "Treat symptomatically while investigating",
        "Reassess after initial results",
        "Escalate to senior review if concerned",
      ],
      teachingPoints: [
        "Anchor your differential to the presenting complaint.",
        "Use red flags to decide urgency and investigations.",
      ],
    };
  }

  return {
    primaryDiagnosis: profile.leading,
    clinicalReasoningSummary: `For ${complaints} in a ${age}-year-old patient, prioritize common causes while actively excluding serious pathology.`,
    differentials: profile.differentials.map((item, index) => ({
      diagnosis: item.name,
      likelihood: item.likelihood,
      probability: item.likelihood === "high" ? 45 : item.likelihood === "moderate" ? 30 : 15,
      reasoning: item.reasoning,
      whyNotPrimary: index === 0 ? undefined : "Less consistent with current data.",
      keyFeatures: [item.reasoning],
    })),
    redFlags: profile.redFlags,
    investigations: patientCase.investigations.length ? patientCase.investigations : profile.investigations,
    management: [
      "Stabilize and monitor vital signs",
      "Targeted investigations based on leading differentials",
      "Symptomatic treatment while awaiting results",
      "Senior review if red flags or diagnostic uncertainty",
    ],
    teachingPoints: [
      "Rank differentials before ordering tests.",
      "Let red flags drive urgency, not anxiety alone.",
    ],
  };
}

export function getLocalClinicalInsight(patientCase: PatientCase): ClinicalAiInsight {
  return diagnosisToInsight(buildProfileDiagnosis(patientCase));
}

export function getFallbackDiagnosis(
  patientCase: PatientCase,
  reason: FallbackReason = "generic",
): DiagnosisResult {
  const diagnosis = buildProfileDiagnosis(patientCase);

  if (reason === "missing_key") {
    return {
      ...diagnosis,
      primaryDiagnosis: "AI unavailable — add GROQ_API_KEY in Vercel",
      teachingPoints: [
        ...diagnosis.teachingPoints,
        "Configure GROQ_API_KEY in Vercel environment variables to enable AI diagnosis.",
      ],
    };
  }

  if (reason === "rate_limit") {
    return {
      ...diagnosis,
      primaryDiagnosis: diagnosis.primaryDiagnosis,
      clinicalReasoningSummary:
        `${diagnosis.clinicalReasoningSummary} AI was rate-limited — this is an offline clinical template. Wait 30–60 seconds and tap Retry diagnosis.`,
      teachingPoints: [
        ...diagnosis.teachingPoints,
        "Groq free tier limits how many AI calls run per minute. Final diagnosis uses one AI call per case.",
      ],
    };
  }

  return diagnosis;
}

export function getFallbackReasonFromError(message?: string): FallbackReason {
  if (!message) return "generic";
  if (/GROQ_API_KEY|not configured/i.test(message)) return "missing_key";
  if (/rate limit/i.test(message)) return "rate_limit";
  return "generic";
}
