import type { OsceGradeResult } from "@/lib/osce/state";

function getApiKey(): string {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();
}

function normalizeModel(value: string): string {
  return value.trim().replace(/^models\//, "");
}

function getDefaultModelCandidates(): string[] {
  const envModel = process.env.GEMINI_TEXT_MODEL?.trim();
  const candidates = [
    envModel ? normalizeModel(envModel) : null,
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ].filter((v): v is string => Boolean(v));
  return [...new Set(candidates)];
}

async function callGemini(params: {
  apiKey: string;
  model: string;
  contents: { role: string; parts: { text: string }[] }[];
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
          ? { systemInstruction: { parts: [{ text: params.systemPrompt }] } }
          : {}),
        contents: params.contents,
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          topP: 0.95,
          maxOutputTokens: params.maxOutputTokens ?? 1024,
        },
      }),
    },
  );

  const responseText = await response.text();
  return { response, responseText };
}

function extractText(responseText: string): string {
  try {
    const data = JSON.parse(responseText) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    return (
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || ""
    );
  } catch {
    return "";
  }
}

export async function generateOSCEResponse(params: {
  conversation: { role: "user" | "patient"; content: string }[];
  systemPrompt: string;
}): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const models = getDefaultModelCandidates();
  let lastError = "";

  const contents = params.conversation.map((msg) => ({
    role: msg.role === "patient" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  for (const model of models) {
    const { response, responseText } = await callGemini({
      apiKey,
      model,
      contents,
      systemPrompt: params.systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    if (!response.ok) {
      const parsed = safeParseError(responseText);
      lastError = parsed || responseText;
      if (response.status === 429 || isQuotaError(lastError) || /overloaded/i.test(lastError)) {
        continue;
      }
      continue;
    }

    const text = extractText(responseText);
    if (text) return text;
  }

  throw new Error(lastError || "Gemini patient response failed");
}

export async function generateOSCEGrade(params: {
  conversation: { role: "user" | "patient"; content: string }[];
  systemPrompt: string;
  caseFullDetails: string;
}): Promise<OsceGradeResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const models = getDefaultModelCandidates();
  let lastError = "";

  const transcript = params.conversation
    .map((msg) => `${msg.role === "user" ? "STUDENT" : "PATIENT"}: ${msg.content}`)
    .join("\n");

  const gradingPrompt = `## CASE DETAILS\n${params.caseFullDetails}\n\n## TRANSCRIPT\n${transcript}\n\n## EVALUATION\nEvaluate the student's performance strictly based on the above transcript and case.`;

  const contents = [
    {
      role: "user",
      parts: [{ text: gradingPrompt }],
    },
  ];

  for (const model of models) {
    const { response, responseText } = await callGemini({
      apiKey,
      model,
      contents,
      systemPrompt: params.systemPrompt,
      temperature: 0.3,
      maxOutputTokens: 4096,
    });

    if (!response.ok) {
      const parsed = safeParseError(responseText);
      lastError = parsed || responseText;
      if (response.status === 429 || isQuotaError(lastError) || /overloaded/i.test(lastError)) {
        continue;
      }
      continue;
    }

    const text = extractText(responseText);
    if (text) {
      const parsed = parseGradeResponse(text);
      if (parsed) return parsed;
      lastError = "Failed to parse grade response";
      continue;
    }
  }

  throw new Error(lastError || "Gemini grading failed");
}

function parseGradeResponse(text: string): OsceGradeResult | null {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;

  try {
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as OsceGradeResult;
  } catch {
    return null;
  }
}

function safeParseError(responseText: string): string | null {
  try {
    const parsed = JSON.parse(responseText) as { error?: { message?: string } };
    return parsed.error?.message || null;
  } catch {
    return null;
  }
}

function isQuotaError(message: string): boolean {
  return /quota exceeded|rate limit|high demand|free_tier|limit: 0|please retry|billing details/i.test(
    message,
  );
}
