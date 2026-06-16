import { getGroqClient, AI_MODELS, aiJsonCompletion } from "@/lib/groq";
import { buildPatientSystemPrompt, buildGraderSystemPrompt } from "@/lib/osce/prompts";
import type { OsceSessionState, OsceGradeResult } from "@/lib/osce/state";

export async function getPatientResponse(
  session: OsceSessionState,
  userInput: string,
): Promise<string> {
  const systemPrompt = buildPatientSystemPrompt(session.caseFullDetails, session.difficulty);

  const groq = getGroqClient();
  if (!groq) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...session.conversation.map((msg) => ({
      role: (msg.role === "patient" ? "assistant" : "user") as "assistant" | "user",
      content: msg.content,
    })),
    { role: "user" as const, content: userInput },
  ];

  const completion = await groq.chat.completions.create({
    model: AI_MODELS.smart,
    temperature: 0.7,
    max_tokens: 1024,
    messages,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error("Empty patient response from AI");
  }

  return response;
}

export async function gradeSession(
  session: OsceSessionState,
): Promise<OsceGradeResult> {
  const systemPrompt = buildGraderSystemPrompt();

  const transcript = session.conversation
    .map((msg) => `${msg.role === "user" ? "STUDENT" : "PATIENT"}: ${msg.content}`)
    .join("\n");

  const userPrompt = `## CASE DETAILS\n${session.caseFullDetails}\n\n## TRANSCRIPT\n${transcript}\n\n## EVALUATION\nEvaluate the student's performance strictly based on the above transcript and case.`;

  const result = await aiJsonCompletion<OsceGradeResult>(
    AI_MODELS.smart,
    systemPrompt,
    userPrompt,
    { fallbackModel: AI_MODELS.fast },
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data!;
}
