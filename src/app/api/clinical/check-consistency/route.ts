import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import type { PatientCase } from "@/lib/types";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a senior clinical reviewer. Your ONLY task is to detect MAJOR medical inconsistencies in a patient's history.

Only flag things that would CHANGE clinical management or the differential diagnosis. Ignore minor omissions, incomplete answers, or expected clinical variation.

Focus ONLY on:

1. DIRECT CONTRADICTIONS: Same symptom explicitly described as both present AND absent (e.g., "fever" listed as symptom but also "no fever" or "denies fever" elsewhere)
2. TIMELINE CONFLICTS: Onset described as both acute (minutes/hours) and chronic (months/years) for the same presentation
3. LOGICAL CONFLICTS: Medically impossible combinations (e.g., "no known drug allergies" but "allergic to penicillin")

Do NOT flag:
- Symptoms missing from a step that wasn't asked yet
- Different symptoms described at different severities
- A symptom only mentioned in one place and not repeated elsewhere
- Normal expected clinical variation
- Incomplete answers or skipped questions

Return a JSON object with this structure:
{
  "contradictions": [
    {
      "type": "direct" | "timeline" | "logical",
      "detail": "Clear description of what contradicts and where",
      "clinicalSignificance": "Why this matters clinically — what it changes in the differential or management",
      "clarificationPrompt": "A specific question to ask the user to resolve this"
    }
  ]
}

If no major inconsistencies found, return { "contradictions": [] }.
Do NOT add extra fields or commentary.`;

function buildPatientSummary(caseData: PatientCase): string {
  const lines: string[] = [];

  lines.push(`Chief complaint(s): ${caseData.chiefComplaints.join(", ") || "none"}`);

  const history: string[] = [];
  for (const [key, value] of Object.entries(caseData.history)) {
    if (key === "complete") continue;
    const display = Array.isArray(value) ? value.join(", ") : String(value);
    history.push(`  ${key}: ${display}`);
  }
  if (history.length) {
    lines.push("History collected:");
    lines.push(...history);
  }

  const exam: string[] = [];
  for (const [key, value] of Object.entries(caseData.exam)) {
    const display = Array.isArray(value) ? value.join(", ") : String(value);
    exam.push(`  ${key}: ${display}`);
  }
  if (exam.length) {
    lines.push("Exam findings:");
    lines.push(...exam);
  }

  if (caseData.investigations.length) {
    lines.push(`Investigations: ${caseData.investigations.join(", ")}`);
  }

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      patientCase: PatientCase;
    };

    const { patientCase } = body;
    if (!patientCase?.chiefComplaints?.length) {
      return NextResponse.json({ contradictions: [] });
    }

    const summary = buildPatientSummary(patientCase);
    const userPrompt = `Analyze this patient history for clinical inconsistencies:\n\n${summary}`;

    const result = await aiJsonCompletion<{ contradictions: Array<{
      type: "direct" | "timeline" | "severity" | "logical";
      detail: string;
      clinicalSignificance: string;
      clarificationPrompt: string;
    }> }>(
      AI_MODELS.smart,
      SYSTEM_PROMPT,
      userPrompt,
      { fallbackModel: AI_MODELS.fast, maxRetries: 2 },
    );

    const contradictions = result.data?.contradictions ?? [];
    return NextResponse.json({
      contradictions,
      aiPowered: !!result.data,
      aiError: result.error?.message ?? null,
    });
  } catch (error) {
    return NextResponse.json({
      contradictions: [],
      aiPowered: false,
      aiError: (error as Error)?.message ?? "Consistency check failed",
    });
  }
}
