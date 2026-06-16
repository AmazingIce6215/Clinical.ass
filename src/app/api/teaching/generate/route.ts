import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import {
  addCaseFingerprints,
  checkSimilarity,
  computeFingerprint,
} from "@/lib/teaching-fingerprint";
import { getSubject } from "@/lib/teaching-subjects";
import type { GeneratedTeachingCase } from "@/lib/types";

export const maxDuration = 60;

type TeachingGenerateBody = {
  subject: string;
  avoidTitles?: string[];
  avoidDiseases?: string[];
  avoidVignettes?: string[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SYSTEM_PROMPT = `You are an expert medical educator creating AMBOSS-style clinical Q-bank cases for medical students.

CRITICAL: You MUST generate a completely new clinical case that has never been used before. Reusing patterns, templates, or previous scenarios is NOT acceptable.

Return ONLY valid JSON and nothing else.
Schema:
{
  "title": "short session title",
  "difficulty": "easy" | "medium" | "hard",
  "vignette": "brief session overview (1-2 sentences)",
  "questions": [
    {
      "id": "q1",
      "patientLabel": "Case 1: e.g. 45-year-old-man with chest pain",
      "vignette": "full clinical vignette for THIS patient (4-6 sentences) — must be clinically unique",
      "prompt": "single best-answer question",
      "options": ["A text", "B text", "C text", "D text", "E text"],
      "correctIndex": 0,
      "explanation": "thorough explanation including why correct and why each distractor is wrong",
      "optionExplanations": ["why option A is correct/incorrect", "why B...", "why C...", "why D...", "why E..."],
      "teachingPearl": "one memorable pearl"
    }
  ]
}

Rules:
- Generate exactly 3 questions per session
- Each question MUST be a single best-answer MCQ with 5 options
- Each question MUST have a completely different patient with unique demographics, presenting complaint, history and diagnosis
- Each vignette must feel like a high-quality exam question with realistic demographics, history, symptoms, vital signs, and relevant exam or lab findings
- Keep the cases clinically accurate, exam-relevant, educational, and detailed enough to function like a true Q-bank item
- Each explanation must include: why the correct answer is right, why each incorrect option is wrong, the underlying mechanism or pathophysiology, and a relevant clinical pearl
- optionExplanations MUST have exactly 5 entries, one per option

UNIQUENESS REQUIREMENTS (MANDATORY):
- Generate a completely new clinical case never used before
- Avoid reuse of previous scenarios or patterns
- Ensure unique combination of symptoms, demographics, and diagnosis
- Do not reuse templates or common textbook cases unless significantly modified
- Every session must include: new patient demographics, new presenting complaint, new history details, new diagnosis, new distractors in MCQs, new clinical reasoning pathway
- The 3 patients must have different ages, different sexes, different chief complaints, and different diagnoses`;

function buildAvoidList(body: TeachingGenerateBody) {
  const { avoidTitles = [], avoidDiseases = [], avoidVignettes = [] } = body;
  return [
    avoidTitles.length
      ? `Titles to avoid:\n${avoidTitles.map((t) => `- ${t}`).join("\n")}`
      : "",
    avoidDiseases.length
      ? `Diagnoses to avoid:\n${avoidDiseases.map((d) => `- ${d}`).join("\n")}`
      : "",
    avoidVignettes.length
      ? `Vignettes to avoid:\n${avoidVignettes.map((v) => `- ${v.slice(0, 100)}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TeachingGenerateBody;
    const subjectInfo = getSubject(body.subject);

    if (!subjectInfo) {
      return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
    }

    const userPrompt = `Create a unique ${subjectInfo.name} teaching session for a 4th year medical student.
Topic area: ${subjectInfo.description}
${buildAvoidList(body)}
Seed: ${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const generated = await aiJsonCompletion<
        Omit<GeneratedTeachingCase, "id" | "subject" | "subjectName" | "generatedAt">
      >(AI_MODELS.smart, SYSTEM_PROMPT, userPrompt, { fallbackModel: AI_MODELS.fast });

      if (!generated.data?.questions || generated.data.questions.length < 3) {
        if (attempts < maxAttempts) {
          await sleep(Math.min(1000 * Math.pow(2, attempts), 8000));
        }
        continue;
      }

      const caseData: GeneratedTeachingCase = {
        id: `${body.subject}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        subject: body.subject,
        subjectName: subjectInfo.name,
        title: generated.data.title,
        difficulty: generated.data.difficulty ?? "medium",
        vignette: generated.data.vignette,
        questions: generated.data.questions.slice(0, 3).map((q, i) => ({
          ...q,
          id: q.id ?? `q${i + 1}`,
          vignette: q.vignette || generated.data!.vignette,
          optionExplanations:
            q.optionExplanations?.length === q.options.length
              ? q.optionExplanations
              : q.options.map((opt, j) =>
                  j === q.correctIndex
                    ? `Correct: ${q.explanation}`
                    : `Incorrect: ${opt} is not the best answer for this clinical scenario.`,
                ),
        })),
        generatedAt: Date.now(),
      };

      const diagnosisText = caseData.questions
        .map((q) => q.options[q.correctIndex])
        .join(" ");

      const { duplicate } = checkSimilarity(
        caseData.title,
        caseData.vignette + " " + caseData.questions.map((q) => q.vignette).join(" "),
        diagnosisText,
      );

      if (duplicate) {
        if (attempts < maxAttempts) {
          await sleep(Math.min(1000 * Math.pow(2, attempts), 8000));
        }
        continue;
      }

      const fingerprints = [
        computeFingerprint(caseData.title, caseData.vignette, diagnosisText),
        ...caseData.questions.map((q) =>
          computeFingerprint(q.vignette.slice(0, 50), q.vignette, q.options[q.correctIndex]),
        ),
      ];
      addCaseFingerprints(fingerprints);

      return NextResponse.json({ case: caseData, aiPowered: true });
    }

    return NextResponse.json(
      {
        error:
          "Unable to generate a new clinical case. Please try again.",
        detail:
          "New cases must be generated in real-time to ensure learning quality.",
        retryable: true,
      },
      { status: 503 },
    );
  } catch (error) {
    console.error("Teaching generate error:", error);
    return NextResponse.json(
      {
        error: "Unable to generate a new clinical case. Please try again.",
        detail:
          "New cases must be generated in real-time to ensure learning quality.",
        retryable: true,
      },
      { status: 500 },
    );
  }
}
