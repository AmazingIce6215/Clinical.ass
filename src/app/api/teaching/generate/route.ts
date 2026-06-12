import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import { getFallbackTeachingCase } from "@/lib/teaching-fallback";
import { getSubject } from "@/lib/teaching-subjects";
import type { GeneratedTeachingCase } from "@/lib/types";

export const maxDuration = 60;

type TeachingGenerateBody = {
  subject: string;
  avoidTitles?: string[];
  avoidDiseases?: string[];
  avoidVignettes?: string[];
};

function buildAvoidList(body: TeachingGenerateBody) {
  const { avoidTitles = [], avoidDiseases = [], avoidVignettes = [] } = body;

  return [
    avoidTitles.length ? `Avoid these titles:\n${avoidTitles.map((t) => `- ${t}`).join("\n")}` : "",
    avoidDiseases.length ? `Avoid these diagnoses:\n${avoidDiseases.map((d) => `- ${d}`).join("\n")}` : "",
    avoidVignettes.length ? `Avoid these patient vignettes:\n${avoidVignettes.map((v) => `- ${v}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TeachingGenerateBody;
    const subjectInfo = getSubject(body.subject);

    if (!subjectInfo) {
      return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
    }

    const systemPrompt = `You are an expert medical educator creating AMBOSS-style clinical Q-bank cases for medical students.
Return ONLY valid JSON and nothing else.
Schema:
{
  "title": "short session title",
  "difficulty": "easy" | "medium" | "hard",
  "vignette": "brief session overview (1-2 sentences)",
  "questions": [
    {
      "id": "q1",
      "patientLabel": "Case 1: e.g. 45-year-old man",
      "vignette": "full clinical vignette for THIS patient (4-6 sentences) — unique patient",
      "prompt": "single best-answer question",
      "options": ["A text", "B text", "C text", "D text", "E text"],
      "correctIndex": 0,
      "explanation": "thorough explanation",
      "optionExplanations": ["why option A is correct/incorrect", "why B...", "why C...", "why D...", "why E..."],
      "teachingPearl": "one memorable pearl"
    }
  ]
}
Rules:
- Generate exactly 3 questions per session
- Each question must be a single best-answer MCQ with 4 or 5 options, but prefer 5 options unless clinically awkward
- Each question MUST have a different, unrelated patient with its own vignette and patientLabel
- Vary the patient demographics, presentation style, specialty, and specific disease within the topic so repeated requests do not produce the same or similar cases
- Each vignette must feel like a high-quality exam question with realistic demographics, history, symptoms, vital signs, and relevant exam or lab findings
- Keep the cases clinically accurate, exam-relevant, educational, and detailed enough to function like a true Q-bank item
- Each explanation must include: why the correct answer is right, why each incorrect option is wrong, the underlying mechanism or pathophysiology, and a relevant clinical pearl
- optionExplanations MUST have one entry per option
- MUST be completely different from any case in the avoid lists`;

    const userPrompt = `Create a unique ${subjectInfo.name} teaching session for a 4th year medical student.
Topic area: ${subjectInfo.description}
Use varied patient demographics, presentations, specialties, and specific diseases so repeated requests do not feel similar.
${buildAvoidList(body)}
Seed for uniqueness: ${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const generated = await aiJsonCompletion<
      Omit<GeneratedTeachingCase, "id" | "subject" | "subjectName" | "generatedAt">
    >(AI_MODELS.smart, systemPrompt, userPrompt, { fallbackModel: AI_MODELS.fast });

    if (!generated.data?.questions || generated.data.questions.length < 3) {
      const fallback = getFallbackTeachingCase(body.subject, subjectInfo.name);
      return NextResponse.json({
        case: fallback,
        aiPowered: false,
        aiError: generated.error?.message ?? "AI failed to generate a full teaching case",
      });
    }

    const caseData: GeneratedTeachingCase = {
      id: `${body.subject}-${Date.now()}`,
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

    return NextResponse.json({ case: caseData, aiPowered: true });
  } catch (error) {
    console.error("Teaching generate error:", error);
    return NextResponse.json({ error: "Failed to generate case" }, { status: 500 });
  }
}
