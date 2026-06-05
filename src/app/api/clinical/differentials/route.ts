import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import { buildClinicalAiContext, CLINICAL_DIAGNOSIS_SYSTEM, diagnosisToInsight } from "@/lib/clinical-ai";
import { getFallbackDiagnosis } from "@/lib/clinical-fallback";
import type { DiagnosisResult, PatientCase } from "@/lib/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  let patientCase: PatientCase = {} as PatientCase;

  try {
    const body = (await request.json()) as {
      patientCase: PatientCase;
      draft?: { fieldKey?: string; category?: string; value?: string | string[] };
    };

    patientCase = body.patientCase;
    const { draft } = body;

    if (patientCase.chiefComplaints.length === 0) {
      const fallback = getFallbackDiagnosis(patientCase);
      return NextResponse.json({
        insight: diagnosisToInsight(fallback),
        diagnosis: fallback,
        aiPowered: false,
      });
    }

    const context = buildClinicalAiContext(patientCase, draft);
    const userPrompt = `Patient case summary:\n${context}\n\nUse only the information above. Do not invent any additional symptoms, exam findings, infections, or test results. Produce diagnosis, differentials, red flags, investigations, management, and teaching points based strictly on the provided data.`;

    const result = await aiJsonCompletion<DiagnosisResult>(
      AI_MODELS.fast,
      CLINICAL_DIAGNOSIS_SYSTEM,
      userPrompt,
      { fallbackModel: AI_MODELS.smart },
    );

    const diagnosis = result.data ?? getFallbackDiagnosis(patientCase);
    const insight = diagnosisToInsight(diagnosis);

    return NextResponse.json({
      insight,
      diagnosis,
      aiPowered: !!result.data,
      aiError: result.error?.message,
    });
  } catch (error) {
    console.error("Differentials error:", error);
    const fallback = getFallbackDiagnosis(patientCase);
    return NextResponse.json({
      insight: diagnosisToInsight(fallback),
      diagnosis: fallback,
      aiPowered: false,
      aiError: "AI differentials request failed",
    });
  }
}
