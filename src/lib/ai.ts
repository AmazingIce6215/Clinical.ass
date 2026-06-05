import Groq from "groq-sdk";

let client: Groq | null = null;

export const AI_MODELS = {
  fast: "llama-3.1-8b-instant",
  smart: "llama-3.3-70b-versatile",
} as const;

const PLACEHOLDER_KEYS = new Set([
  "",
  "your_groq_api_key_here",
  "gsk_your_groq_api_key_here",
  "changeme",
  "replace_me",
]);

const MAX_RETRIES = 4;

export function isGroqConfigured(): boolean {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return false;
  return !PLACEHOLDER_KEYS.has(apiKey.toLowerCase());
}

export function getGroqClient() {
  if (!isGroqConfigured()) return null;
  const apiKey = process.env.GROQ_API_KEY!.trim();
  if (!client) client = new Groq({ apiKey });
  return client;
}

export interface AiResult<T> {
  data: T | null;
  error?: { message: string; code?: string };
}

export function formatAiError(message: string): string {
  const normalized = message.trim();

  if (/rate_limit|rate limit reached|tokens per minute/i.test(normalized)) {
    return "Groq rate limit reached — too many AI requests in a short window. Wait 30–60 seconds and try again.";
  }

  if (normalized.includes("GROQ_API_KEY")) {
    return normalized;
  }

  const jsonMatch = normalized.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { error?: { message?: string } };
      if (parsed.error?.message) {
        return formatAiError(parsed.error.message);
      }
    } catch {
      // ignore malformed JSON fragments
    }
  }

  if (normalized.length > 180) {
    return "AI request failed. Please try again in a moment.";
  }

  return normalized;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRateLimitDelayMs(message: string): number | null {
  if (!/rate_limit|rate limit reached|429/i.test(message)) return null;

  const tryAgain = message.match(/try again in (\d+)ms/i);
  if (tryAgain) {
    return Math.max(parseInt(tryAgain[1]!, 10) + 250, 750);
  }

  return 1500;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "AI request failed";
}

async function runCompletion<T>(
  model: string,
  system: string,
  user: string,
): Promise<AiResult<T>> {
  const groq = getGroqClient();
  if (!groq) {
    return {
      data: null,
      error: {
        message:
          "GROQ_API_KEY is not configured. Add it in Vercel Project Settings → Environment Variables.",
        code: "missing_api_key",
      },
    };
  }

  let lastError = "AI request failed";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) return { data: null, error: { message: "Empty AI response" } };

      const parsed = typeof raw === "string" ? parseJsonString(raw) : raw;
      return { data: parsed as T };
    } catch (err) {
      lastError = extractErrorMessage(err);
      const retryDelay = parseRateLimitDelayMs(lastError);

      if (retryDelay && attempt < MAX_RETRIES - 1) {
        await sleep(retryDelay * (attempt + 1));
        continue;
      }

      return {
        data: null,
        error: {
          message: formatAiError(lastError),
          code: retryDelay ? "rate_limit_exceeded" : "ai_request_failed",
        },
      };
    }
  }

  return {
    data: null,
    error: { message: formatAiError(lastError), code: "rate_limit_exceeded" },
  };
}

export async function aiJsonCompletion<T>(
  model: string,
  system: string,
  user: string,
  options?: { fallbackModel?: string },
): Promise<AiResult<T>> {
  const primary = await runCompletion<T>(model, system, user);
  if (primary.data) return primary;

  const isRateLimited = primary.error?.code === "rate_limit_exceeded";
  const fallbackModel = options?.fallbackModel;

  if (!fallbackModel || fallbackModel === model || isRateLimited) {
    return primary;
  }

  const fallback = await runCompletion<T>(fallbackModel, system, user);
  if (fallback.data) return fallback;

  return {
    data: null,
    error: fallback.error ?? primary.error ?? { message: "AI request failed" },
  };
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
