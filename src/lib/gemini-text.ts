export type GeminiTextResult = {
  text: string;
  model: string;
};

export type GeminiTextConfig = {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  modelCandidates?: string[];
};

export const GEMINI_MODELS = {
  fast: "gemini-2.0-flash-lite",
  smart: "gemini-2.0-flash",
} as const;

export type AiResult<T> = {
  data: T | null;
  error?: { message: string; code?: string };
};

export function isGeminiQuotaError(message: string) {
  return /quota exceeded|rate limit|high demand|free_tier|limit: 0|please retry|billing details/i.test(
    message,
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonResponse(raw: string): unknown {
  const text = raw.trim();
  if (!text) throw new Error("Empty Gemini JSON response");
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return JSON.parse(text.slice(firstBracket, lastBracket + 1));
    }
    throw new Error("Unable to parse Gemini JSON response");
  }
}

export async function geminiJsonCompletion<T>(
  system: string,
  user: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
  },
): Promise<AiResult<T>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      data: null,
      error: { message: "GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not configured", code: "missing_api_key" },
    };
  }

  const models = getDefaultModelCandidates();
  let lastError = "";

  for (const model of models) {
    try {
      const { response, responseText } = await callGeminiText({
        apiKey,
        model,
        prompt: user,
        systemPrompt: system,
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxOutputTokens ?? 8192,
      });

      if (!response.ok) {
        try {
          const parsed = JSON.parse(responseText) as { error?: { message?: string } };
          lastError = parsed.error?.message || responseText;
        } catch {
          lastError = responseText;
        }

        if (response.status === 429 || isGeminiQuotaError(lastError)) {
          await sleep(2000);
          continue;
        }

        return { data: null, error: { message: lastError || "Gemini request failed" } };
      }

      const text = extractText(responseText);
      if (!text) return { data: null, error: { message: "Empty Gemini response" } };

      const parsed = parseJsonResponse(text);
      return { data: parsed as T };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Gemini request failed";
    }
  }

  return { data: null, error: { message: lastError || "Gemini request failed" } };
}

function normalizeModel(value: string) {
  return value.trim().replace(/^models\//, "");
}

function getApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)?.trim() || "";
}

function getDefaultModelCandidates() {
  const envModel = process.env.GEMINI_TEXT_MODEL?.trim();
  const candidates = [
    envModel ? normalizeModel(envModel) : null,
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates)];
}

function extractText(responseText: string) {
  const data = JSON.parse(responseText) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

async function callGeminiText(params: {
  apiKey: string;
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
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
        ...(params.systemPrompt
          ? {
              systemInstruction: {
                parts: [{ text: params.systemPrompt }],
              },
            }
          : {}),
        contents: [
          {
            role: "user",
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          temperature: params.temperature ?? 0.8,
          topP: 0.95,
          maxOutputTokens: params.maxOutputTokens ?? 4096,
        },
      }),
    },
  );

  const responseText = await response.text();
  return { response, responseText };
}

export async function generateGeminiText(config: GeminiTextConfig): Promise<GeminiTextResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }

  const models = config.modelCandidates?.length ? config.modelCandidates : getDefaultModelCandidates();
  let lastError = "";

  for (const model of models) {
    const { response, responseText } = await callGeminiText({
      apiKey,
      model,
      prompt: config.prompt,
      systemPrompt: config.systemPrompt,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    });

    if (!response.ok) {
      try {
        const parsed = JSON.parse(responseText) as { error?: { message?: string } };
        lastError = parsed.error?.message || responseText;
      } catch {
        lastError = responseText;
      }

      if (response.status === 429 || isGeminiQuotaError(lastError) || /overloaded|try again later/i.test(lastError)) {
        continue;
      }

      continue;
    }

    const text = extractText(responseText);
    return { text, model };
  }

  throw new Error(lastError || "Gemini request failed");
}
