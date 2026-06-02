import Groq from "groq-sdk";

let client: Groq | null = null;

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!client) {
    client = new Groq({ apiKey });
  }
  return client;
}

export const GROQ_MODELS = {
  fast: "llama-3.1-8b-instant",
  smart: "llama-3.3-70b-versatile",
} as const;

export async function groqJsonCompletion<T>(
  model: string,
  system: string,
  user: string,
): Promise<T | null> {
  const groq = getGroqClient();
  if (!groq) return null;

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
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
