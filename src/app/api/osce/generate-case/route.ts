import { NextResponse } from "next/server";
import { AI_MODELS, aiJsonCompletion } from "@/lib/groq";
import { buildCaseGenerationPrompt } from "@/lib/osce/prompts";
import type { OsceCase, Difficulty } from "@/lib/osce/state";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      difficulty?: Difficulty;
    };
    const difficulty = body.difficulty || "medium";

    const prompt = buildCaseGenerationPrompt(difficulty);

    const result = await aiJsonCompletion<OsceCase>(
      AI_MODELS.fast,
      "You are a medical educator generating OSCE cases. Return ONLY valid JSON. No markdown formatting. No code blocks.",
      prompt,
    );

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const caseData = result.data!;
    caseData.difficulty = difficulty;

    return NextResponse.json(caseData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
