import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import { buildClinicalAiContext, CLINICAL_DIAGNOSIS_SYSTEM } from "@/lib/clinical-ai";
import { getFallbackDiagnosis } from "@/lib/clinical-fallback";
import type { DiagnosisResult, PatientCase } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { patientCase: PatientCase };
    const { patientCase } = body;

    const context = buildClinicalAiContext(patientCase);
    const userPrompt = `Patient case summary:\n${context}\n\nUse only the information above. Do not invent any additional symptoms, exam findings, cardiac findings, or test results. Provide diagnosis, differentials, red flags, investigations, management plan, and teaching points based strictly on the provided data.`;

    const result = await aiJsonCompletion<DiagnosisResult>(
      AI_MODELS.smart,
      CLINICAL_DIAGNOSIS_SYSTEM,
      userPrompt,
    );

    const diagnosis = result.data ?? getFallbackDiagnosis(patientCase);

    return NextResponse.json({ diagnosis, aiPowered: !!result.data, aiError: result.error?.message });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return NextResponse.json({ error: "Failed to generate diagnosis" }, { status: 500 });
  }
}
