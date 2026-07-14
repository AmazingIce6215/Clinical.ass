import { NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/gemini-text";

export const maxDuration = 30;

type GeminiTextBody = {
  prompt?: string;
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  modelCandidates?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeminiTextBody;
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const result = await generateGeminiText({
      prompt,
      systemPrompt: body.systemPrompt?.trim(),
      temperature: body.temperature,
      maxOutputTokens: body.maxOutputTokens,
      modelCandidates: body.modelCandidates,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "The generated response is temporarily unavailable." },
      { status: 500 },
    );
  }
}
