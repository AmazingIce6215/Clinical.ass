import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import { CLINICAL_DIAGNOSIS_SYSTEM, diagnosisToInsight } from "@/lib/clinical-ai";
import { getFallbackDiagnosis } from "@/lib/clinical-fallback";
import type { ClinicalAiInsight, DiagnosisResult, PatientCase } from "@/lib/types";

const FALLBACK_INSIGHT: ClinicalAiInsight = {
  leadingDiagnosis: "Gathering data…",
  reasoning: "Complete history and examination steps — AI differentials update as you go.",
  urgency: "stable",
  differentials: [],
  suggestedInvestigations: [],
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      patientCase: PatientCase;
      draft?: { fieldKey?: string; category?: string; value?: string | string[] };
    };

    const { patientCase } = body;

    if (patientCase.chiefComplaints.length === 0) {
      const fallback = getFallbackDiagnosis(patientCase);
      return NextResponse.json({
        insight: FALLBACK_INSIGHT,
        diagnosis: fallback,
        aiPowered: false,
      });
    }

    const userPrompt = `Complete case:\n${JSON.stringify(patientCase, null, 2)}\n\nProvide diagnosis, differentials, red flags, investigations, management plan, and teaching points.`;

    const result = await aiJsonCompletion<DiagnosisResult>(
      AI_MODELS.smart,
      CLINICAL_DIAGNOSIS_SYSTEM,
      userPrompt,
    );

    const diagnosis = result.data ?? getFallbackDiagnosis(patientCase);
    const insight = result.data ? diagnosisToInsight(diagnosis) : FALLBACK_INSIGHT;

    return NextResponse.json({
      insight,
      diagnosis,
      aiPowered: !!result.data,
      aiError: result.error?.message,
    });
  } catch (error) {
    console.error("Differentials error:", error);
    const fallback = getFallbackDiagnosis({} as PatientCase);
    return NextResponse.json(
      { insight: FALLBACK_INSIGHT, diagnosis: fallback, aiPowered: false },
      { status: 500 },
    );
  }
}
