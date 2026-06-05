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
  error?: { message: string };
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
      },
    };
  }

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
    const message = err instanceof Error ? err.message : "AI request failed";
    return { data: null, error: { message } };
  }
}

export async function aiJsonCompletion<T>(
  model: string,
  system: string,
  user: string,
  options?: { fallbackModel?: string },
): Promise<AiResult<T>> {
  const primary = await runCompletion<T>(model, system, user);
  if (primary.data) return primary;

  const fallbackModel = options?.fallbackModel;
  if (!fallbackModel || fallbackModel === model) return primary;

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
