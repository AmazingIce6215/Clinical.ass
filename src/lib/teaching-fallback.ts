import type { GeneratedTeachingCase } from "./types";

function makeQuestion(
  id: string,
  patientLabel: string,
  vignette: string,
  prompt: string,
  correctIndex: number,
  explanation: string,
  teachingPearl: string,
): GeneratedTeachingCase["questions"][number] {
  const options = [
    "Most likely diagnosis based on presentation",
    "Important alternative diagnosis to exclude",
    "Less likely benign mimic",
    "Unrelated chronic condition",
    "Normal variant / no pathology",
  ];

  return {
    id,
    patientLabel,
    vignette,
    prompt,
    options,
    correctIndex,
    explanation,
    optionExplanations: options.map((opt, index) =>
      index === correctIndex
        ? `Correct: ${explanation}`
        : `Incorrect: ${opt} does not best fit this vignette.`,
    ),
    teachingPearl,
  };
}

export function getFallbackTeachingCase(
  subjectId: string,
  subjectName: string,
): GeneratedTeachingCase {
  const topic = subjectName.toLowerCase();

  return {
    id: `${subjectId}-offline-${Date.now()}`,
    subject: subjectId,
    subjectName,
    title: `${subjectName} Offline Practice`,
    difficulty: "medium",
    vignette:
      "Offline practice session. Add GROQ_API_KEY in Vercel to enable live AI-generated cases.",
    questions: [
      makeQuestion(
        "q1",
        "Case 1: 42-year-old patient",
        `A patient presents with a classic ${topic} complaint. Vitals are stable and the history is focused on onset, duration, and red-flag symptoms.`,
        "What is the most appropriate next step in evaluation?",
        0,
        "Start with a focused history and targeted examination before ordering broad testing.",
        "Always anchor your workup to the leading pre-test probability.",
      ),
      makeQuestion(
        "q2",
        "Case 2: 58-year-old patient",
        `Another patient with a different ${topic} presentation has risk factors and atypical features that broaden the differential.`,
        "Which investigation best helps narrow the differential?",
        1,
        "Choose tests that confirm or exclude your leading serious diagnoses efficiently.",
        "Investigations should discriminate between your top two differentials.",
      ),
      makeQuestion(
        "q3",
        "Case 3: 31-year-old patient",
        `A third patient needs initial management while awaiting results. The presentation is compatible with a common ${topic} condition.`,
        "What is the best initial management plan?",
        0,
        "Stabilize the patient, treat the most likely diagnosis, and reassess after targeted workup.",
        "Management should match severity, not every possible diagnosis at once.",
      ),
    ],
    generatedAt: Date.now(),
  };
}
