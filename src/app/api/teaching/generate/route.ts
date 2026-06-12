import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import { getFallbackTeachingCase } from "@/lib/teaching-fallback";
import { getSubject } from "@/lib/teaching-subjects";
import type { GeneratedTeachingCase } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      subject: string;
      avoidTitles?: string[];
      avoidDiseases?: string[];
      avoidVignettes?: string[];
    };

    const { subject, avoidTitles = [], avoidDiseases = [], avoidVignettes = [] } = body;
    const subjectInfo = getSubject(subject);

    if (!subjectInfo) {
      return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
    }

    const systemPrompt = `You are an expert medical educator creating USMLE-style clinical cases for medical students.
Return ONLY valid JSON:
{
  "title": "short session title",
  "difficulty": "easy" | "medium" | "hard",
  "vignette": "brief session overview (1-2 sentences)",
  "questions": [
    {
      "id": "q1",
      "patientLabel": "Case 1: e.g. 45-year-old man",
      "vignette": "full clinical vignette for THIS patient (4-6 sentences) — unique patient",
      "prompt": "question text",
      "options": ["A text", "B text", "C text", "D text", "E text"],
      "correctIndex": 0,
      "explanation": "why the correct answer is correct",
      "optionExplanations": ["why option A is correct/incorrect", "why B...", "why C...", "why D...", "why E..."],
      "teachingPearl": "one memorable pearl"
    }
  ]
}
Rules:
- Generate exactly 3 questions per session (diagnosis, investigation, management)
- Each question MUST have a DIFFERENT, UNRELATED patient with its own vignette and patientLabel
- Patients must vary in age, sex, presentation, and diagnosis
- Each question must have exactly 5 options
- optionExplanations MUST have one entry per option
- Case must be clinically accurate and exam-relevant
- MUST be completely different from any case in the avoid lists`;

    const avoidList = [
      avoidTitles.length ? `Avoid these titles:\n${avoidTitles.map((t) => `- ${t}`).join("\n")}` : "",
      avoidDiseases.length ? `Avoid these diagnoses:\n${avoidDiseases.map((d) => `- ${d}`).join("\n")}` : "",
      avoidVignettes.length ? `Avoid these patient vignettes:\n${avoidVignettes.map((v) => `- ${v}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const userPrompt = `Create a unique ${subjectInfo.name} teaching session for a 4th year medical student.
Topic area: ${subjectInfo.description}
Use varied patient demographics, presentations, and diagnoses.
${avoidList}
Seed for uniqueness: ${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const generated = await aiJsonCompletion<
      Omit<GeneratedTeachingCase, "id" | "subject" | "subjectName" | "generatedAt">
    >(AI_MODELS.smart, systemPrompt, userPrompt, { fallbackModel: AI_MODELS.fast });

    if (!generated.data?.questions || generated.data.questions.length < 3) {
      const fallback = getFallbackTeachingCase(subject, subjectInfo.name);
      return NextResponse.json({
        case: fallback,
        aiPowered: false,
        aiError: generated.error?.message ?? "AI failed to generate a full teaching case",
      });
    }

    const caseData: GeneratedTeachingCase = {
      id: `${subject}-${Date.now()}`,
      subject,
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
