import Groq from "groq-sdk";

let client: Groq | null = null;

export const AI_MODELS = {
  fast: "llama-3.1-8b-instant",
  smart: "llama-3.3-70b-versatile",
} as const;

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Groq({ apiKey });
  return client;
}

export interface AiResult<T> {
  data: T | null;
  error?: { message: string };
}

export async function aiJsonCompletion<T>(
  model: string,
  system: string,
  user: string,
): Promise<AiResult<T>> {
  const groq = getGroqClient();
  if (!groq) {
    return { data: null, error: { message: "GROQ_API_KEY not configured" } };
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

    return { data: JSON.parse(raw) as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return { data: null, error: { message } };
  }
}
