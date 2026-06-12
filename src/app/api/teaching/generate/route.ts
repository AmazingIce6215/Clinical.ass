import { NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/gemini-text";
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

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TeachingGenerateBody;
    const subjectInfo = getSubject(body.subject);

    if (!subjectInfo) {
      return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
    }

    const systemPrompt = `You are an expert medical educator creating AMBOSS-style clinical teaching cases for medical students.
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
- Include realistic demographics, history, symptoms, vital signs, and relevant exam or lab findings in each vignette
- Keep the cases clinically accurate, exam-relevant, and educational
- Each explanation must include: why the correct answer is right, why each incorrect option is wrong, the underlying mechanism or pathophysiology, and a relevant clinical pearl
- optionExplanations MUST have one entry per option
- MUST be completely different from any case in the avoid lists`;

    const userPrompt = `Create a unique ${subjectInfo.name} teaching session for a 4th year medical student.
Topic area: ${subjectInfo.description}
Use varied patient demographics, presentations, specialties, and specific diseases so repeated requests do not feel similar.
${buildAvoidList(body)}
Seed for uniqueness: ${Date.now()}-${Math.random().toString(36).slice(2)}`;

    let raw = "";
    try {
      const result = await generateGeminiText({
        systemPrompt,
        prompt: userPrompt,
        temperature: 0.9,
        maxOutputTokens: 4096,
        modelCandidates: ["gemini-2.0-flash", "gemini-2.0-flash-lite"],
      });
      raw = result.text;
    } catch (error) {
      const fallback = getFallbackTeachingCase(body.subject, subjectInfo.name);
      return NextResponse.json({
        case: fallback,
        aiPowered: false,
        aiError: error instanceof Error ? error.message : "AI failed to generate a full teaching case",
      });
    }

    let parsed: Omit<GeneratedTeachingCase, "id" | "subject" | "subjectName" | "generatedAt">;
    try {
      parsed = JSON.parse(extractJson(raw)) as typeof parsed;
    } catch {
      const fallback = getFallbackTeachingCase(body.subject, subjectInfo.name);
      return NextResponse.json({
        case: fallback,
        aiPowered: false,
        aiError: "Gemini returned an invalid teaching case payload",
      });
    }

    if (!parsed?.questions || parsed.questions.length < 3) {
      const fallback = getFallbackTeachingCase(body.subject, subjectInfo.name);
      return NextResponse.json({
        case: fallback,
        aiPowered: false,
        aiError: "Gemini failed to generate enough questions",
      });
    }

    const caseData: GeneratedTeachingCase = {
      id: `${body.subject}-${Date.now()}`,
      subject: body.subject,
      subjectName: subjectInfo.name,
      title: parsed.title,
      difficulty: parsed.difficulty ?? "medium",
      vignette: parsed.vignette,
      questions: parsed.questions.slice(0, 3).map((q, i) => ({
        ...q,
        id: q.id ?? `q${i + 1}`,
        vignette: q.vignette || parsed.vignette,
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
