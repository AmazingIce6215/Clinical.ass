import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import type { PatientCase } from "@/lib/types";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a senior clinical reviewer. Your ONLY task is to detect inconsistencies in a patient's history.

Review the collected patient data below and identify any clinical inconsistencies. Focus on:

1. DIRECT CONTRADICTIONS: Same symptom described as both present and absent (e.g., "fever" but also "no fever")
2. TIMELINE CONFLICTS: Onset described as both acute and chronic for the same complaint
3. SEVERITY MISMATCHES: Same condition described with wildly different severities
4. CLINICAL INCONSISTENCIES: Medically incompatible findings (e.g., "no cough" but "productive cough")
5. LOGICAL CONFLICTS: Impossible combinations (e.g., "no known drug allergies" but "allergic to penicillin")

Be strict but fair. Only flag REAL inconsistencies — not expected clinical variation.
Do NOT flag differences between distinct, unrelated symptoms as contradictions.
A symptom being absent in one body system review but present as a chief complaint IS a contradiction.

Return a JSON object with this structure:
{
  "contradictions": [
    {
      "type": "direct" | "timeline" | "severity" | "logical",
      "detail": "Clear description of what contradicts and where",
      "clinicalSignificance": "Why this matters clinically — what it changes in the differential or management",
      "clarificationPrompt": "A specific question to ask the user to resolve this"
    }
  ]
}

If no inconsistencies found, return { "contradictions": [] }.
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
