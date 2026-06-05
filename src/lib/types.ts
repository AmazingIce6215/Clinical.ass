export type Sex = "male" | "female" | "other";
export type CaseMode = "clinical" | "classic" | "teaching";
export type InputType = "chips" | "text" | "yesno" | "multiselect";

export interface PatientCase {
  name: string;
  sex: Sex | "";
  age: number | null;
  chiefComplaints: string[];
  history: Record<string, string | string[] | boolean>;
  exam: Record<string, string | string[]>;
  investigations: string[];
}

export interface ClinicalStepResponse {
  nextStep: string;
  question: string;
  inputType: InputType;
  options?: string[];
  allowCustom?: boolean;
  fieldKey: string;
  category: "hpi" | "exam" | "investigations" | "complete" | "pmh" | "drugs" | "family" | "social" | "ros";
  sectionLabel?: string;
  reasonForAsking?: string;
  teachingPearl?: string;
  missingCritical?: string[];
  workingDifferentials?: Array<{
    diagnosis: string;
    likelihood: "high" | "moderate" | "low";
  }>;
}

export type ClassicStepResponse = ClinicalStepResponse;

export interface DiagnosisResult {
  primaryDiagnosis: string;
  clinicalReasoningSummary: string;
  differentials: Array<{
    diagnosis: string;
    likelihood: string;
    reasoning: string;
    whyNotPrimary?: string;
    keyFeatures?: string[];
  }>;
  redFlags: Array<{ flag: string; whyItMatters: string }> | string[];
  investigations: string[];
  management: string[];
  teachingPoints: string[];
}

export interface ClinicalAiInsight {
  leadingDiagnosis: string;
  reasoning: string;
  urgency: "stable" | "urgent" | "emergency";
  differentials: Array<{
    diagnosis: string;
    likelihood: "high" | "moderate" | "low";
    reasoning: string;
    confidence: number;
  }>;
  suggestedInvestigations: Array<{ test: string; rationale: string }>;
  nextClinicalFocus?: string;
}

export interface ClassicPresentation {
  oneLiner: string;
  fullPresentation: string;
  keyPoints: string[];
  suggestedQuestions: string[];
}

export interface TeachingQuestion {
  id: string;
  prompt: string;
  vignette: string;
  patientLabel?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  optionExplanations: string[];
  teachingPearl: string;
}

export interface GeneratedTeachingCase {
  id: string;
  title: string;
  subject: string;
  subjectName: string;
  difficulty: "easy" | "medium" | "hard";
  vignette: string;
  questions: TeachingQuestion[];
  generatedAt: number;
  favorited?: boolean;
}

export interface SavedCase {
  id: string;
  mode: CaseMode;
  title: string;
  subject?: string;
  tags: string[];
  savedAt: number;
  patientCase?: PatientCase;
  diagnosis?: DiagnosisResult;
  presentation?: ClassicPresentation;
  teachingCase?: GeneratedTeachingCase;
}
