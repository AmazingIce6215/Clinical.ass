"use client";

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
    probability?: number;
    reasoning: string;
    whyNotPrimary?: string;
    keyFeatures?: string[];
    supportingFindings?: string[];
    findingsAgainst?: string[];
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

export interface CoPilotInsight {
  keyQuestions: string[];
  examSteps: string[];
  expectedFindings: Array<{ pathway: string; findings: string[] }>;
  redFlags: string[];
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

export interface ReasoningNode {
  label: string;
  type: "symptom" | "pathway" | "diagnosis" | "elimination" | "final";
  supporting?: string[];
  against?: string[];
  reasoning?: string;
  children?: ReasoningNode[];
}

export interface ReasoningTreeData {
  tree: ReasoningNode;
  viewModes?: ("simple" | "deep")[];
}

// ── Teaching Mode Stats ──

export interface QuestionAttempt {
  questionId: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  userAnswer: number;
  correctAnswer: number;
  correct: boolean;
  timeTaken: number;
  timestamp: number;
  topic?: string;
  vignette: string;
  prompt: string;
  options: string[];
  correctAnswerText: string;
  userAnswerText: string;
}

export interface SubjectStat {
  attempted: number;
  correct: number;
  accuracy: number;
  history: Array<{
    timestamp: number;
    correct: boolean;
    difficulty: string;
    timeTaken: number;
  }>;
}

export interface WeakTopic {
  topic: string;
  incorrectCount: number;
  lastSeen: number;
  totalAttempts: number;
  accuracy: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;
}

export interface ActivityDay {
  date: string;
  questionsAnswered: number;
}

export interface SubjectAiInsight {
  strengths: Array<{ area: string; detail: string; topics: string[] }>;
  weaknesses: Array<{ area: string; detail: string; topics: string[]; severity: "high" | "medium" | "low" }>;
  recommendations: string[];
  generatedAt: number;
  attemptCount: number;
}

export interface UserStats {
  subjectStats: Record<string, SubjectStat>;
  weakTopics: Record<string, WeakTopic>;
  streak: StreakData;
  activityLog: ActivityDay[];
  recentAttempts: QuestionAttempt[];
  subjectAiInsights: Record<string, SubjectAiInsight>;
}

// ── OSCE Mode Stats ──

export interface OsceSessionRecord {
  id: string;
  score: number;
  breakdown: {
    history: number;
    differential: number;
    investigations: number;
    management: number;
  };
  difficulty: "easy" | "medium" | "hard";
  passed: boolean;
  missedRedFlags: number;
  missedKeyQuestions: number;
  anchoringErrors: number;
  timestamp: number;
}

export interface OsceDomainStat {
  key: "history" | "differential" | "investigations" | "management";
  label: string;
  average: number;
  max: number;
}

export interface OsceTrendPoint {
  sessionIndex: number;
  score: number;
  timestamp: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface OsceWeakness {
  type: "domain" | "pattern";
  label: string;
  severity: "high" | "medium" | "low";
  frequency: number;
  description: string;
}

export interface OsceDifficultyStats {
  easy: { sessions: number; averageScore: number };
  medium: { sessions: number; averageScore: number };
  hard: { sessions: number; averageScore: number };
}

export interface OsceStats {
  sessions: OsceSessionRecord[];
  streak: StreakData;
  weeklyLog: ActivityDay[];
}

// ── Clinical Consistency Engine ──

export interface ClinicalMemoryEntry {
  symptom: string;
  present: boolean;
  source: string;
  rawValue: string;
}

export interface ClinicalContradiction {
  type: "direct" | "timeline" | "severity" | "logical";
  symptom: string;
  detail: string;
  clinicalSignificance: string;
  clarificationPrompt: string;
  previousEntry: ClinicalMemoryEntry;
  newEntry: ClinicalMemoryEntry;
  severity: "high" | "medium" | "low";
}