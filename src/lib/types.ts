export type Sex = "male" | "female" | "other";

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
  category: "hpi" | "exam" | "investigations" | "complete";
  missingCritical?: string[];
  workingDifferentials?: Array<{
    diagnosis: string;
    likelihood: "high" | "moderate" | "low";
  }>;
  teachingPearl?: string;
}

export interface DiagnosisResult {
  primaryDiagnosis: string;
  differentials: Array<{
    diagnosis: string;
    likelihood: string;
    reasoning: string;
  }>;
  redFlags: string[];
  investigations: string[];
  management: string[];
  teachingPoints: string[];
}

export interface TeachingQuestion {
  id: string;
  prompt: string;
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

export interface TeachingCase {
  id: string;
  title: string;
  specialty: string;
  difficulty: "easy" | "medium" | "hard";
  vignette: string;
  questions: TeachingQuestion[];
}
