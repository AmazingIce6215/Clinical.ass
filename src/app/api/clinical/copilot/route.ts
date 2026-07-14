import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import type { ClinicalAiInsight, CoPilotInsight, PatientCase } from "@/lib/types";

const CO_PILOT_SYSTEM = `You are a clinical thinking coach for a learner using Orizon. Do NOT generate final diagnoses, ranked differentials, or treatment plans. You only help with:
- what to ask next
- what to examine next
- what findings to expect
- how to differentiate between already-suggested possibilities

Keep output concise, clinically sharp, and senior-resident style. Do NOT repeat the live AI sidebar's suggested differential content as another diagnosis list. If that sidebar data is available, reference it indirectly, e.g. "If cardiac vs GI causes are being considered...".

Return ONLY a single JSON object with these keys:
- keyQuestions: string[]
- examSteps: string[]
- expectedFindings: Array<{ pathway: string; findings: string[] }>
- redFlags: string[]
`;

function buildPatientSummary(patientCase: PatientCase) {
  const lines: string[] = [];
  if (patientCase.chiefComplaints.length > 0) {
    lines.push(`Symptoms: ${patientCase.chiefComplaints.join(", ")}`);
  }

  const historyEntries = Object.entries(patientCase.history);
  if (historyEntries.length > 0) {
    lines.push("Current findings:");
    for (const [key, value] of historyEntries) {
      lines.push(`- ${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
    }
  }

  const examEntries = Object.entries(patientCase.exam);
  if (examEntries.length > 0) {
    lines.push("Physical exam findings:");
    for (const [key, value] of examEntries) {
      lines.push(`- ${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
    }
  }

  if (patientCase.investigations.length > 0) {
    lines.push(`Investigations already ordered: ${patientCase.investigations.join(", ")}`);
  }

  return lines.join("\n");
}

function buildAiSidebarHint(aiInsight?: ClinicalAiInsight | null) {
  if (!aiInsight?.differentials?.length) return "No live AI sidebar suggestions are available.";

  const possible = aiInsight.differentials.map((d) => d.diagnosis).join(", ");
  return `The live AI sidebar is considering pathways such as ${possible}. Do not generate a ranked differential list; instead, use this as indirect context for what to ask and examine next.`;
}

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      patientCase: PatientCase;
      aiInsight?: ClinicalAiInsight | null;
    };

    const { patientCase, aiInsight } = body;
    if (!patientCase?.chiefComplaints?.length) {
      return NextResponse.json(
        {
          insight: null,
          aiPowered: false,
          aiError: "Co-Pilot requires at least one presenting complaint.",
        },
        { status: 400 },
      );
    }

    const patientSummary = buildPatientSummary(patientCase);
    const aiHint = buildAiSidebarHint(aiInsight);
    const userPrompt = `Patient summary:\n${patientSummary}\n\n${aiHint}\n\nProvide only the requested coaching output with the correct JSON keys.`;

    const result = await aiJsonCompletion<CoPilotInsight>(
      AI_MODELS.fast,
      CO_PILOT_SYSTEM,
      userPrompt,
      { fallbackModel: AI_MODELS.smart, maxRetries: 2 },
    );

    const insight = result.data;
    return NextResponse.json({
      insight,
      aiPowered: !!result.data,
      aiError: result.error?.message,
    });
    } catch {
    return NextResponse.json(
      {
        insight: null,
        aiPowered: false,
        aiError: "Generated coaching is temporarily unavailable.",
      },
      { status: 500 },
    );
  }
}
