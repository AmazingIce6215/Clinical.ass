import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import { CLINICAL_DIAGNOSIS_SYSTEM } from "@/lib/clinical-ai";
import { getFallbackDiagnosis } from "@/lib/clinical-fallback";
import type { DiagnosisResult, PatientCase } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { patientCase: PatientCase };
    const { patientCase } = body;

    const userPrompt = `Complete patient case:\n${JSON.stringify(patientCase, null, 2)}\n\nProvide diagnosis, differentials, red flags, investigations, management plan, and teaching points.`;

    const result = await aiJsonCompletion<DiagnosisResult>(
      AI_MODELS.smart,
      CLINICAL_DIAGNOSIS_SYSTEM,
      userPrompt,
    );

    const diagnosis = result.data ?? getFallbackDiagnosis(patientCase);

    return NextResponse.json({ diagnosis, aiPowered: !!result.data });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return NextResponse.json({ error: "Failed to generate diagnosis" }, { status: 500 });
  }
}
