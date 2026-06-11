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

function normalizeModel(value: string) {
  return value.trim().replace(/^models\//, "");
}

function getModelCandidates() {
  const envModel = process.env.GEMINI_VISION_MODEL?.trim();
  const candidates = [
    envModel ? normalizeModel(envModel) : null,
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates)];
}

async function callGeminiVision(params: {
  apiKey: string;
  model: string;
  imageBase64: string;
  mimeType: string;
  prompt: string;
}) {
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
            parts: [
              {
                inline_data: {
                  mime_type: params.mimeType,
                  data: params.imageBase64,
                },
              },
              { text: params.prompt },
            ],
          },
        ],
      }),
    },
  );

  const responseText = await response.text();
  return { response, responseText };
}

export async function POST(request: Request) {
  try {
    const apiKey =
      (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)?.trim();
    const models = getModelCandidates();
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    let body: GeminiVisionBody;
    try {
      body = (await request.json()) as GeminiVisionBody;
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    const imageBase64 = body.imageBase64?.trim();
    const mimeType = body.mimeType?.trim() || "image/jpeg";
    const prompt = body.prompt?.trim();

    if (!imageBase64 || !prompt) {
      return NextResponse.json({ error: "imageBase64 and prompt are required" }, { status: 400 });
    }

    const cleanedImage = cleanBase64(imageBase64);
    if (!/^[A-Za-z0-9+/=]+$/.test(cleanedImage)) {
      return NextResponse.json(
        { error: "Image data is not valid base64" },
        { status: 400 },
      );
    }

    let lastDetails = "";
    let lastStatus = 502;

    for (const model of models) {
      const { response, responseText } = await callGeminiVision({
        apiKey,
        model,
        imageBase64: cleanedImage,
        mimeType,
        prompt,
      });

      if (!response.ok) {
        lastStatus = response.status;
        try {
          const parsed = JSON.parse(responseText) as { error?: { message?: string } };
          lastDetails = parsed.error?.message || responseText;
        } catch {
          lastDetails = responseText;
        }

        const shouldFallback =
          response.status === 429 ||
          /high demand|quota|rate limit|overloaded|try again later/i.test(lastDetails);
        if (shouldFallback && model !== models[models.length - 1]) {
          continue;
        }

        continue;
      }

      let data: {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      try {
        data = JSON.parse(responseText) as typeof data;
      } catch {
        return NextResponse.json(
          { error: "Gemini returned a non-JSON response", details: responseText, model },
          { status: 502 },
        );
      }

      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim() || "";

      return NextResponse.json({ text, model });
    }

    return NextResponse.json(
      { error: "Gemini request failed", details: lastDetails, model: models[models.length - 1] },
      { status: lastStatus },
    );
  } catch (error) {
    console.error("Gemini vision error:", error);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
