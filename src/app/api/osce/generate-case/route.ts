import { NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/gemini-text";
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

    const result = await generateGeminiText({
      prompt,
      systemPrompt:
        "You are a medical educator generating OSCE cases. Return ONLY valid JSON. No markdown formatting. No code blocks.",
      temperature: 0.8,
      maxOutputTokens: 2048,
    });

    const cleaned = result.text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      return NextResponse.json(
        { error: "Failed to parse generated case" },
        { status: 500 },
      );
    }

    const caseData = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as OsceCase;
    caseData.difficulty = difficulty;

    return NextResponse.json(caseData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
