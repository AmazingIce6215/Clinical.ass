import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import type { SubjectAiInsight } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert medical educator analyzing a student's performance on clinical MCQ questions.

You will receive a list of the student's question attempts in a specific medical subject. Each attempt includes the clinical vignette, the question asked, the answer options, what the student chose, and whether they got it right.

Analyze the student's performance and return a JSON object with:
1. "strengths": Array of areas where the student performed well (2-4 items). Each item has "area" (short topic name), "detail" (why it's a strength, referencing specific questions), and "topics" (array of relevant topic keywords).
2. "weaknesses": Array of areas where the student needs improvement (2-4 items). Each item has "area" (short topic name), "detail" (what they're doing wrong, referencing specific questions), "topics" (array of relevant topic keywords), and "severity" ("high", "medium", or "low").
3. "recommendations": Array of 2-4 specific, actionable study recommendations based on their performance patterns.

Rules:
- Be specific and reference the actual clinical content from the questions
- Base insights on patterns across multiple questions, not isolated mistakes
- Strengths should be areas where the student shows consistent understanding
- Weaknesses should identify specific clinical knowledge gaps
- Recommendations should be practical and targeted to the identified gaps
- Keep the analysis concise but clinically meaningful

Return ONLY valid JSON:
{
  "strengths": [{ "area": "string", "detail": "string", "topics": ["string"] }],
  "weaknesses": [{ "area": "string", "detail": "string", "topics": ["string"], "severity": "high" | "medium" | "low" }],
  "recommendations": ["string"]
}`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      subject: string;
      subjectName: string;
      attempts: Array<{
        vignette: string;
        prompt: string;
        options: string[];
        correctAnswerText: string;
        userAnswerText: string;
        correct: boolean;
        timeTaken: number;
        difficulty: string;
      }>;
    };

    if (!body.attempts || body.attempts.length === 0) {
      return NextResponse.json(
        { error: "No question attempts provided for analysis" },
        { status: 400 },
      );
    }

    const attemptsText = body.attempts
      .map(
        (a, i) =>
          `Question ${i + 1}:
Vignette: ${a.vignette}
Question: ${a.prompt}
Options: ${a.options.map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join(" | ")}
Correct answer: ${a.correctAnswerText}
Student's answer: ${a.userAnswerText}
Result: ${a.correct ? "CORRECT" : "WRONG"}
Time: ${a.timeTaken}s
Difficulty: ${a.difficulty}`,
      )
      .join("\n\n");

    const userPrompt = `Analyze this student's performance in ${body.subjectName}.

They answered ${body.attempts.length} questions in this subject.
${body.attempts.filter((a) => a.correct).length} correct, ${body.attempts.filter((a) => !a.correct).length} incorrect.

Here are their question attempts:

${attemptsText}

Identify their strengths, weaknesses, and give targeted recommendations.`;

    const result = await aiJsonCompletion<SubjectAiInsight>(
      AI_MODELS.smart,
      SYSTEM_PROMPT,
      userPrompt,
      { fallbackModel: AI_MODELS.fast },
    );

    if (!result.data) {
      return NextResponse.json(
        { error: result.error?.message ?? "AI analysis failed" },
        { status: 503 },
      );
    }

    const insight: SubjectAiInsight = {
      strengths: result.data.strengths ?? [],
      weaknesses: result.data.weaknesses ?? [],
      recommendations: result.data.recommendations ?? [],
      generatedAt: Date.now(),
      attemptCount: body.attempts.length,
    };

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Teaching analyze error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
