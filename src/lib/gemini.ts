import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return false;
  return apiKey !== "" && apiKey !== "your_gemini_api_key_here";
}

export function getGeminiClient() {
  if (!isGeminiConfigured()) return null;
  const apiKey = process.env.GEMINI_API_KEY!.trim();
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client;
}

export interface GeminiResult<T> {
  data: T | null;
  error?: { message: string; code?: string };
}

export async function geminiJsonCompletion<T>(
  system: string,
  user: string,
  options?: { maxRetries?: number },
): Promise<GeminiResult<T>> {
  const genAI = getGeminiClient();
  if (!genAI) {
    return {
      data: null,
      error: {
        message:
          "GEMINI_API_KEY is not configured. Add it in Vercel Project Settings → Environment Variables.",
        code: "missing_api_key",
      },
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const maxRetries = options?.maxRetries ?? 4;

  let lastError = "AI request failed";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const fullPrompt = `${system}\n\n${user}`;
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();

      if (!text) {
        return { data: null, error: { message: "Empty AI response" } };
      }

      // Parse JSON from the response
      const parsed = parseJsonString(text);
      return { data: parsed as T };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "AI request failed";

      if (attempt < maxRetries - 1) {
        // Wait before retrying with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      return {
        data: null,
        error: {
          message: formatGeminiError(lastError),
          code: "ai_request_failed",
        },
      };
    }
  }

  return {
    data: null,
    error: { message: formatGeminiError(lastError), code: "ai_request_failed" },
  };
}

function formatGeminiError(message: string): string {
  const normalized = message.trim();

  if (normalized.includes("GEMINI_API_KEY")) {
    return normalized;
  }

  if (normalized.length > 180) {
    return "AI request failed. Please try again in a moment.";
  }

  return normalized;
}

function parseJsonString(raw: string): unknown {
  const text = raw.trim();
  if (!text) throw new Error("Empty AI JSON string");
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Unable to parse AI JSON response");
  }
}
