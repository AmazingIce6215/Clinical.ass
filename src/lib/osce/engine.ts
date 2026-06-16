import { geminiTextCompletion, geminiJsonCompletion } from "@/lib/gemini-text";
import { buildPatientSystemPrompt, buildGraderSystemPrompt } from "@/lib/osce/prompts";
import type { OsceSessionState, OsceGradeResult } from "@/lib/osce/state";

export async function getPatientResponse(
  session: OsceSessionState,
  userInput: string,
): Promise<string> {
  const system = buildPatientSystemPrompt(session.caseFullDetails, session.difficulty);

  const messages = session.conversation.map((msg) => ({
    role: (msg.role === "patient" ? "assistant" : "user") as "user" | "assistant",
    content: msg.content,
  }));
  messages.push({ role: "user" as const, content: userInput });

  const result = await geminiTextCompletion(
    system,
    messages,
    { temperature: 0.7, maxOutputTokens: 1024 },
  );

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Empty patient response from AI");
  }

  return result.data;
}

export async function gradeSession(
  session: OsceSessionState,
): Promise<OsceGradeResult> {
  const systemPrompt = buildGraderSystemPrompt();

  const transcript = session.conversation
    .map((msg) => `${msg.role === "user" ? "STUDENT" : "PATIENT"}: ${msg.content}`)
    .join("\n");

  const userPrompt = `## CASE DETAILS\n${session.caseFullDetails}\n\n## TRANSCRIPT\n${transcript}\n\n## EVALUATION\nEvaluate the student's performance strictly based on the above transcript and case.`;

  const result = await geminiJsonCompletion<OsceGradeResult>(
    systemPrompt,
    userPrompt,
    { temperature: 0.3, maxOutputTokens: 4096 },
  );

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Failed to grade session");
  }

  return result.data;
}
