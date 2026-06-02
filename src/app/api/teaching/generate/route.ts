import { NextResponse } from "next/server";
import { groqJsonCompletion, GROQ_MODELS } from "@/lib/groq";
import { getSubject } from "@/lib/teaching-subjects";
import type { GeneratedTeachingCase } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      subject: string;
      avoidTitles?: string[];
    };

    const { subject, avoidTitles = [] } = body;
    const subjectInfo = getSubject(subject);

    if (!subjectInfo) {
      return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
    }

    const systemPrompt = `You are an expert medical educator creating USMLE-style clinical cases for medical students.
Return ONLY valid JSON:
{
  "title": "short case title",
  "difficulty": "easy" | "medium" | "hard",
  "vignette": "detailed clinical vignette (4-8 sentences)",
  "questions": [
    {
      "id": "q1",
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
- Generate exactly 3 questions per case (diagnosis, investigation, management)
- Each question must have exactly 5 options
- optionExplanations MUST have one entry per option explaining why it is correct OR incorrect
- Case must be clinically accurate and exam-relevant
- MUST be completely different from any case in the avoid list`;

    const avoidList =
      avoidTitles.length > 0
        ? `\nDo NOT repeat or closely resemble these previous cases:\n${avoidTitles.map((t) => `- ${t}`).join("\n")}`
        : "";

    const userPrompt = `Create a unique ${subjectInfo.name} clinical case for a 4th year medical student.
Topic area: ${subjectInfo.description}
Use varied patient demographics, presentations, and diagnoses.${avoidList}
Seed for uniqueness: ${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const generated = await groqJsonCompletion<Omit<GeneratedTeachingCase, "id" | "subject" | "subjectName" | "generatedAt">>(
      GROQ_MODELS.smart,
      systemPrompt,
      userPrompt,
    );

    if (!generated?.questions?.length) {
      return NextResponse.json(
        { error: "AI failed to generate case. Check GROQ_API_KEY." },
        { status: 503 },
      );
    }

    const caseData: GeneratedTeachingCase = {
      id: `${subject}-${Date.now()}`,
      subject,
      subjectName: subjectInfo.name,
      title: generated.title,
      difficulty: generated.difficulty ?? "medium",
      vignette: generated.vignette,
      questions: generated.questions.map((q, i) => ({
        ...q,
        id: q.id ?? `q${i + 1}`,
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
