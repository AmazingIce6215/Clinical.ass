const GENERAL_MESSAGES = [
  "Reviewing the recorded history and examination findings.",
  "Organizing the case by clinical problem.",
  "Comparing the findings across the working differential.",
  "Checking for red flags and time-sensitive features.",
  "Reviewing suggested investigations and their rationale.",
  "Preparing an educational management outline.",
  "Summarizing the clinical reasoning and key uncertainties.",
  "Structuring the case for a clear clinical review.",
] as const;

const CONTEXT_MESSAGES: Record<string, readonly string[]> = {
  chest: [
    "Reviewing cardiovascular, respiratory, and musculoskeletal features.",
    "Checking the chest-pain history for time-sensitive features.",
  ],
  fever: [
    "Reviewing possible infectious and inflammatory sources.",
    "Checking the recorded observations for sepsis-related features.",
  ],
  abdominal: [
    "Reviewing gastrointestinal, urinary, and surgical features.",
    "Checking the abdominal history for urgent surgical features.",
  ],
  headache: [
    "Reviewing the headache history for secondary causes and red flags.",
    "Comparing neurological features across the differential.",
  ],
  breath: [
    "Reviewing respiratory and cardiovascular causes of breathlessness.",
    "Checking the recorded findings for respiratory compromise.",
  ],
  cough: [
    "Reviewing the duration, associated symptoms, and respiratory findings.",
  ],
  rash: [
    "Reviewing the morphology, distribution, and associated systemic features.",
  ],
  dizzy: [
    "Comparing vestibular, cardiovascular, and neurological features.",
  ],
  nausea: [
    "Reviewing gastrointestinal, metabolic, medication, and neurological features.",
  ],
};

const COMPLAINT_KEYWORDS: Array<{ keys: string[]; context: string }> = [
  { keys: ["chest pain", "chest"], context: "chest" },
  { keys: ["fever", "pyrexia", "temperature"], context: "fever" },
  { keys: ["abdominal", "stomach", "belly", "gut"], context: "abdominal" },
  { keys: ["headache", "head pain", "migraine"], context: "headache" },
  { keys: ["shortness of breath", "breathless", "dyspnea", "dyspnoea", "sob"], context: "breath" },
  { keys: ["cough"], context: "cough" },
  { keys: ["rash", "skin", "lesion", "itch"], context: "rash" },
  { keys: ["dizz", "vertigo", "syncope", "faint"], context: "dizzy" },
  { keys: ["nausea", "vomit", "emesis"], context: "nausea" },
];

function detectContexts(complaints: string[]) {
  const joined = complaints.join(" ").toLowerCase();
  const found = new Set<string>();

  for (const { keys, context } of COMPLAINT_KEYWORDS) {
    if (keys.some((key) => joined.includes(key))) {
      found.add(context);
    }
  }

  return [...found];
}

function pickRandom(items: readonly string[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function pickDiagnosisLoadingMessage(options: {
  patientName?: string;
  complaints?: string[];
  exclude?: string;
}): string {
  const contexts = detectContexts(options.complaints ?? []);
  const contextualMessages = contexts.flatMap((context) => CONTEXT_MESSAGES[context] ?? []);
  const candidates = [...GENERAL_MESSAGES, ...contextualMessages];
  const filtered = candidates.filter((message) => message !== options.exclude);

  return pickRandom(filtered.length > 0 ? filtered : candidates);
}
