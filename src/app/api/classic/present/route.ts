import { NextResponse } from "next/server";
import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";
import type { ClassicPresentation, PatientCase } from "@/lib/types";

const SYSTEM = `You are a medical educator helping students prepare ward-round case presentations.
Return ONLY valid JSON:
{
  "oneLiner": "single sentence summary for handover",
  "fullPresentation": "structured case presentation in prose (HPI, PMH, drugs, family, social, ROS, exam) — professional clinical language",
  "keyPoints": ["important highlights for the consultant"],
  "suggestedQuestions": ["questions the consultant might ask"]
}
Rules:
- Use professional clinical language suitable for presenting to a consultant
- Do NOT use honorifics like "Sir" or "Ma'am"
- Base the presentation only on provided case data
- If data is missing, note it was not assessed`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { patientCase: PatientCase };
    const { patientCase } = body;

    const userPrompt = `Patient case collected by student:\n${JSON.stringify(patientCase, null, 2)}\n\nGenerate a ward-round case presentation.`;

    const result = await aiJsonCompletion<ClassicPresentation>(
      AI_MODELS.smart,
      SYSTEM,
      userPrompt,
    );

    if (!result.data) {
      const fallback: ClassicPresentation = {
        oneLiner: `${patientCase.name || "Patient"}, ${patientCase.age}y, presenting with ${patientCase.chiefComplaints.join(", ") || "symptoms"}.`,
        fullPresentation: buildFallbackPresentation(patientCase),
        keyPoints: ["Complete history collected", "Add GROQ_API_KEY for AI-generated presentation"],
        suggestedQuestions: ["What is your leading diagnosis?", "What investigations would you order?"],
      };
      return NextResponse.json({ presentation: fallback, aiPowered: false });
    }

    return NextResponse.json({ presentation: result.data, aiPowered: true });
  } catch (error) {
    console.error("Presentation error:", error);
    return NextResponse.json({ error: "Failed to generate presentation" }, { status: 500 });
  }
}

function buildFallbackPresentation(patientCase: PatientCase): string {
  const lines = [
    `This is ${patientCase.name || "the patient"}, a ${patientCase.age}-year-old ${patientCase.sex} presenting with ${patientCase.chiefComplaints.join(", ")}.`,
  ];
  if (Object.keys(patientCase.history).length) {
    lines.push(`History: ${JSON.stringify(patientCase.history)}`);
  }
  if (Object.keys(patientCase.exam).length) {
    lines.push(`Examination: ${JSON.stringify(patientCase.exam)}`);
  }
  return lines.join("\n\n");
}
