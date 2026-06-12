import { NextResponse } from "next/server";
import { getFallbackTeachingCase } from "@/lib/teaching-fallback";
import { getSubject } from "@/lib/teaching-subjects";
import type { GeneratedTeachingCase } from "@/lib/types";

export const maxDuration = 60;

type GeminiTeachingBody = {
  subject: string;
  avoidTitles?: string[];
  avoidDiseases?: string[];
  avoidVignettes?: string[];
};

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)?.trim() || "";
}

function buildAvoidList(body: GeminiTeachingBody) {
  const { avoidTitles = [], avoidDiseases = [], avoidVignettes = [] } = body;
  return [
    avoidTitles.length ? `Avoid these titles:\n${avoidTitles.map((t) => `- ${t}`).join("\n")}` : "",
    avoidDiseases.length ? `Avoid these diagnoses:\n${avoidDiseases.map((d) => `- ${d}`).join("\n")}` : "",
    avoidVignettes.length ? `Avoid these patient vignettes:\n${avoidVignettes.map((v) => `- ${v}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function callGeminiText(params: { apiKey: string; model: string; prompt: string }) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    },
  );

  const responseText = await response.text();
  return { response, responseText };
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
    const body = (await request.json()) as GeminiTeachingBody;

    const { subject } = body;
    const subjectInfo = getSubject(subject);

    if (!subjectInfo) {
      return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
    }

    const systemPrompt = `You are an expert medical educator creating AMBOSS-style multiple choice teaching cases for medical students.
Return ONLY valid JSON. Do not wrap in markdown fences or add commentary.
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
- Generate exactly 3 questions per session
- Each question must be a single best-answer MCQ with 4 or 5 options, but prefer 5 options unless clinically awkward
- Each question MUST have a different, unrelated patient with its own vignette and patientLabel
- Make the cases feel like AMBOSS: realistic, exam-relevant, concise but detailed, and clinically specific
- Include realistic demographics, history, symptoms, vital signs, and relevant exam or lab findings in each vignette
- The prompt, vignette, and explanations should fit a medical student teaching style
- optionExplanations MUST have one entry per option
- Case must be clinically accurate and exam-relevant
- MUST be completely different from any case in the avoid lists`;
    const avoidList = buildAvoidList(body);

    const userPrompt = `Create a unique ${subjectInfo.name} teaching session for a 4th year medical student.
Topic area: ${subjectInfo.description}
Use varied patient demographics, presentations, specialties, and specific diseases so repeated requests do not feel similar.
${avoidList}
Seed for uniqueness: ${Date.now()}-${Math.random().toString(36).slice(2)}
Please make the explanation section for each question thorough and include:
- why the correct answer is right
- why each incorrect option is wrong
- the underlying mechanism or pathophysiology
- one relevant clinical pearl

Important: keep the response as JSON only.`;

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    let lastError = "";
    let parsed:
      | Omit<GeneratedTeachingCase, "id" | "subject" | "subjectName" | "generatedAt">
      | null = null;

    for (const model of GEMINI_MODELS) {
      const { response, responseText } = await callGeminiText({
        apiKey,
        model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
      });

      if (!response.ok) {
        lastError = responseText;
        if (response.status === 429 || /high demand|quota|rate limit|overloaded|try again later/i.test(responseText)) {
          continue;
        }
        continue;
      }

      try {
        parsed = JSON.parse(extractJson(responseText)) as typeof parsed;
      } catch {
        lastError = responseText;
        continue;
      }

      if (!parsed?.questions || parsed.questions.length < 3) {
        lastError = "Gemini returned an incomplete teaching case";
        parsed = null;
        continue;
      }

      break;
    }

    if (!parsed) {
      const fallback = getFallbackTeachingCase(subject, subjectInfo.name);
      return NextResponse.json({
        case: fallback,
        aiPowered: false,
        aiError: lastError || "AI failed to generate a full teaching case",
      });
    }

    const caseData: GeneratedTeachingCase = {
      id: `${subject}-${Date.now()}`,
      subject,
      subjectName: subjectInfo.name,
      title: parsed.title,
      difficulty: parsed.difficulty ?? "medium",
      vignette: parsed.vignette,
      questions: parsed.questions.slice(0, 3).map((q, i) => ({
        ...q,
        id: q.id ?? `q${i + 1}`,
        vignette: q.vignette || parsed!.vignette,
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
