import { NextResponse } from "next/server";
import { geminiJsonCompletion } from "@/lib/gemini";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import { buildClinicalAiContext, CLINICAL_DIAGNOSIS_SYSTEM } from "@/lib/clinical-ai";
import { getFallbackDiagnosis, getFallbackReasonFromError } from "@/lib/clinical-fallback";
import type { DiagnosisResult, PatientCase } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { patientCase: PatientCase };
    const { patientCase } = body;

    const context = buildClinicalAiContext(patientCase);
    const userPrompt = `Patient case summary:\n${context}\n\nUse only the information above. Do not invent any additional symptoms, exam findings, cardiac findings, or test results. Provide diagnosis, differentials, red flags, investigations, management plan, and teaching points based strictly on the provided data.`;

    // Try Gemini first for final diagnosis
    let result = await geminiJsonCompletion<DiagnosisResult>(
      CLINICAL_DIAGNOSIS_SYSTEM,
      userPrompt,
      { maxRetries: 6 },
    );

    // Fall back to Groq if Gemini fails
    if (!result.data) {
      console.log("Gemini failed, falling back to Groq");
      result = await aiJsonCompletion<DiagnosisResult>(
        AI_MODELS.smart,
        CLINICAL_DIAGNOSIS_SYSTEM,
        userPrompt,
        { maxRetries: 6, baseRetryDelayMs: 2 },
      );
    }

    const diagnosis =
      result.data ??
      getFallbackDiagnosis(patientCase, getFallbackReasonFromError(result.error?.message));

    return NextResponse.json({
      diagnosis,
      aiPowered: !!result.data,
      aiError: result.data ? undefined : result.error?.message,
    });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return NextResponse.json({ error: "Failed to generate diagnosis" }, { status: 500 });
  }
}
