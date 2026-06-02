import { NextResponse } from "next/server";
import { getFallbackStep } from "@/lib/clinical-fallback";
import { groqJsonCompletion, GROQ_MODELS } from "@/lib/groq";
import type { ClinicalStepResponse, PatientCase } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      patientCase: PatientCase;
      stepIndex: number;
    };

    const { patientCase, stepIndex } = body;

    const systemPrompt = `You are a clinical reasoning tutor for medical students. 
Return ONLY valid JSON matching this schema:
{
  "nextStep": "string id",
  "question": "string",
  "inputType": "chips" | "text" | "yesno" | "multiselect",
  "options": ["string"] (optional),
  "allowCustom": boolean (optional),
  "fieldKey": "string key to store answer",
  "category": "hpi" | "exam" | "investigations" | "complete",
  "missingCritical": ["string"],
  "workingDifferentials": [{"diagnosis": "string", "likelihood": "high"|"moderate"|"low"}],
  "teachingPearl": "string (optional, 1 sentence)"
}
Ask ONE focused clinical question at a time. Suggest common options as chips when appropriate.
After sufficient history and exam, set category to "investigations" or "complete".`;

    const userPrompt = `Patient case so far:
${JSON.stringify(patientCase, null, 2)}

Step index: ${stepIndex}
Generate the next most important clinical question to narrow the differential.`;

    const aiStep = await groqJsonCompletion<ClinicalStepResponse>(
      GROQ_MODELS.fast,
      systemPrompt,
      userPrompt,
    );

    const step = aiStep ?? getFallbackStep(patientCase, stepIndex);

    return NextResponse.json({ step, aiPowered: !!aiStep });
  } catch (error) {
    console.error("Clinical step error:", error);
    return NextResponse.json(
      { error: "Failed to generate next step" },
      { status: 500 },
    );
  }
}
