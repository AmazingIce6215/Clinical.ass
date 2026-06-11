import { NextResponse } from "next/server";

export const maxDuration = 30;

type GeminiVisionBody = {
  imageBase64?: string;
  mimeType?: string;
  prompt?: string;
};

function cleanBase64(value: string) {
  const trimmed = value.trim();
  const commaIndex = trimmed.indexOf(",");
  if (commaIndex >= 0 && trimmed.startsWith("data:")) {
    return trimmed.slice(commaIndex + 1);
  }
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const model = process.env.GEMINI_VISION_MODEL || "gemini-3.5-flash";
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GeminiVisionBody;
    const imageBase64 = body.imageBase64?.trim();
    const mimeType = body.mimeType?.trim() || "image/jpeg";
    const prompt = body.prompt?.trim();

    if (!imageBase64 || !prompt) {
      return NextResponse.json({ error: "imageBase64 and prompt are required" }, { status: 400 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64(imageBase64),
                  },
                },
                { text: prompt },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      let details = errorText;
      try {
        const parsed = JSON.parse(errorText) as { error?: { message?: string } };
        details = parsed.error?.message || errorText;
      } catch {
        details = errorText;
      }

      return NextResponse.json(
        { error: "Gemini request failed", details, model },
        { status: response.status },
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

    return NextResponse.json({ text, model });
  } catch (error) {
    console.error("Gemini vision error:", error);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
