import { NextResponse } from "next/server";
import { geminiJsonCompletion } from "@/lib/gemini-text";
import { buildCaseGenerationPrompt } from "@/lib/osce/prompts";
import type { OsceCase, Difficulty } from "@/lib/osce/state";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      difficulty?: Difficulty;
    };
    const difficulty = body.difficulty || "medium";

    const prompt = buildCaseGenerationPrompt(difficulty);

    const result = await geminiJsonCompletion<OsceCase>(
      "You are a medical educator generating OSCE cases. Return ONLY valid JSON.",
      prompt,
      { temperature: 0.3, maxOutputTokens: 8192 },
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
