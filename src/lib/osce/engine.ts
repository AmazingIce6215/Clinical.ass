import { generateOSCEResponse, generateOSCEGrade } from "@/lib/ai/gemini-osce";
import { buildPatientSystemPrompt, buildGraderSystemPrompt } from "@/lib/osce/prompts";
import type { OsceSessionState, OsceGradeResult } from "@/lib/osce/state";

export async function getPatientResponse(
  session: OsceSessionState,
  userInput: string,
): Promise<string> {
  const systemPrompt = buildPatientSystemPrompt(session.caseFullDetails, session.difficulty);

  const updatedConversation: { role: "user" | "patient"; content: string }[] = [
    ...session.conversation,
    { role: "user", content: userInput },
  ];

  const response = await generateOSCEResponse({
    conversation: updatedConversation,
    systemPrompt,
  });

  return response;
}

export async function gradeSession(
  session: OsceSessionState,
): Promise<OsceGradeResult> {
  const systemPrompt = buildGraderSystemPrompt();

  const result = await generateOSCEGrade({
    conversation: session.conversation,
    systemPrompt,
    caseFullDetails: session.caseFullDetails,
  });

  return result;
}
