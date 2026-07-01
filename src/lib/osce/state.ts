export type Difficulty = "easy" | "medium" | "hard";

export interface OsceQuestion {
  question: string;
  answer: string;
  timestamp: number;
}

export interface OsceSessionState {
  caseId: string;
  casePresentation: string;
  caseFullDetails: string;
  patientSex: "male" | "female" | "other";
  difficulty: Difficulty;
  timeRemaining: number;
  duration: number;
  questionsAsked: OsceQuestion[];
  missedKeyPoints: string[];
  differentialAttempted: string[];
  managementAttempted: string[];
  riskFlags: string[];
  startTime: number;
  status: "idle" | "active" | "submitted";
  conversation: { role: "user" | "patient"; content: string }[];
}

export interface OsceGradeResult {
  score: number;
  breakdown: {
    history: number;
    differential: number;
    investigations: number;
    management: number;
  };
  clinicalReasoning: string;
  critical_mistakes: string[];
  missed_red_flags: string[];
  examiner_feedback: string[];
  model_answer: {
    history: string[];
    differential: string[];
    investigations: string[];
    management: string[];
  };
}

export interface IdealAnswer {
  keyHistoryQuestions: string[];
  redFlags: string[];
  differentials: string[];
  investigations: string[];
  managementPlan: string[];
}

export interface OsceCase {
  id: string;
  sex: "male" | "female" | "other";
  presentation: string;
  fullDetails: string;
  difficulty: Difficulty;
}

export function createInitialState(caseData: OsceCase, duration: number): OsceSessionState {
  return {
    caseId: caseData.id,
    casePresentation: caseData.presentation,
    caseFullDetails: caseData.fullDetails,
    patientSex: caseData.sex,
    difficulty: caseData.difficulty,
    timeRemaining: duration,
    duration,
    questionsAsked: [],
    missedKeyPoints: [],
    differentialAttempted: [],
    managementAttempted: [],
    riskFlags: [],
    startTime: Date.now(),
    status: "active",
    conversation: [
      { role: "patient", content: caseData.presentation },
    ],
  };
}
