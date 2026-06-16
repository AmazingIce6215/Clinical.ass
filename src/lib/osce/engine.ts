import { getGroqClient, AI_MODELS, aiJsonCompletion } from "@/lib/groq";
import {
  buildPatientSystemPrompt,
  buildIdealAnswerPrompt,
  buildGraderWithBenchmarkPrompt,
} from "@/lib/osce/prompts";
import type { OsceSessionState, OsceGradeResult, IdealAnswer } from "@/lib/osce/state";

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
    model: AI_MODELS.fast,
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

async function generateIdealAnswer(caseFullDetails: string): Promise<IdealAnswer | null> {
  const prompt = buildIdealAnswerPrompt(caseFullDetails);

  const result = await aiJsonCompletion<IdealAnswer>(
    AI_MODELS.smart,
    "You are a senior clinical examiner generating an ideal OSCE answer benchmark.",
    prompt,
  );

  if (result.error || !result.data) {
    console.warn("Ideal answer generation failed, falling back:", result.error?.message);
    return null;
  }

  return result.data;
}

export async function gradeSession(
  session: OsceSessionState,
): Promise<OsceGradeResult> {
  const transcript = session.conversation
    .map((msg) => `${msg.role === "user" ? "STUDENT" : "PATIENT"}: ${msg.content}`)
    .join("\n");

  // Step 1: Generate the ideal answer benchmark
  const idealAnswer = await generateIdealAnswer(session.caseFullDetails);

  // Step 2: Grade against the ideal benchmark
  if (idealAnswer) {
    const idealAnswerJson = JSON.stringify(idealAnswer, null, 2);
    const userPrompt = buildGraderWithBenchmarkPrompt(
      session.caseFullDetails,
      transcript,
      idealAnswerJson,
    );

    const result = await aiJsonCompletion<OsceGradeResult>(
      AI_MODELS.smart,
      "You are a senior medical examiner grading an OSCE station. Evaluate against the ideal benchmark, not subjectively.",
      userPrompt,
      { fallbackModel: AI_MODELS.fast },
    );

    if (result.data) {
      return result.data;
    }
  }

  // Fallback: prompt the smart model directly with transcript and case
  const directPrompt = `## CASE DETAILS\n${session.caseFullDetails}\n\n## TRANSCRIPT\n${transcript}\n\n## EVALUATION\nEvaluate the student's performance strictly based on the above transcript and case. Apply structured clinical reasoning: identify what was covered, what was missed, detect anchoring bias, premature closure, and safety gaps. Then derive domain scores based on specific findings.`;

  const fallback = await aiJsonCompletion<OsceGradeResult>(
    AI_MODELS.smart,
    `You are a senior medical examiner grading an OSCE station. You must evaluate the candidate against what a competent clinician would do.

## SCORING RULES
- History (0-40): Start at 40. Deduct -5 per essential question missed, -8 per missed red flag, -4 per incomplete review.
- Differential (0-20): Start at 20. Deduct -6 for missing life-threatening diagnosis, -4 per missed plausible differential, -5 for anchoring.
- Investigations (0-20): Start at 20. Deduct -5 per essential test missed, -3 per unnecessary test.
- Management (0-20): Start at 20. Deduct -6 for dangerous omission, -4 per missing treatment step, -3 for failing to recognize urgency.

Return ONLY valid JSON with this structure:
{ "score": number, "breakdown": { "history": number, "differential": number, "investigations": number, "management": number }, "clinicalReasoning": "step-by-step examiner reasoning", "critical_mistakes": string[], "missed_red_flags": string[], "examiner_feedback": string[], "model_answer": { "history": string[], "differential": string[], "investigations": string[], "management": string[] } }`,
    directPrompt,
    { fallbackModel: AI_MODELS.fast },
  );

  if (fallback.data) {
    return fallback.data;
  }

  throw new Error(fallback.error?.message || "Failed to grade session");
}
