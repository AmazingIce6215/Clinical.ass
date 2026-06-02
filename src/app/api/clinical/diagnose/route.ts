import { NextResponse } from "next/server";
import { getFallbackDiagnosis } from "@/lib/clinical-fallback";
import { groqJsonCompletion, GROQ_MODELS } from "@/lib/groq";
import type { DiagnosisResult, PatientCase } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { patientCase: PatientCase };
    const { patientCase } = body;

    const systemPrompt = `You are a senior clinician teaching medical students.
Return ONLY valid JSON:
{
  "primaryDiagnosis": "string",
  "differentials": [{"diagnosis": "string", "likelihood": "string", "reasoning": "string"}],
  "redFlags": ["string"],
  "investigations": ["string"],
  "management": ["string"],
  "teachingPoints": ["string"]
}
Be educational. Include 3-5 differentials ranked by likelihood.`;

    const userPrompt = `Complete patient case:
${JSON.stringify(patientCase, null, 2)}

Provide diagnosis, differentials, red flags, investigations, management plan, and teaching points.`;

    const result = await groqJsonCompletion<DiagnosisResult>(
      GROQ_MODELS.smart,
      systemPrompt,
      userPrompt,
    );

    const diagnosis = result ?? getFallbackDiagnosis(patientCase);

    return NextResponse.json({ diagnosis, aiPowered: !!result });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return NextResponse.json(
      { error: "Failed to generate diagnosis" },
      { status: 500 },
    );
  }
}
