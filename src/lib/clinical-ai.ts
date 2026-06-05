import type { ClinicalAiInsight, DiagnosisResult, PatientCase } from "./types";
import { getCollectedSummary } from "./question-dedup";

export function buildClinicalAiContext(
  patientCase: PatientCase,
  draft?: {
    fieldKey?: string;
    category?: string;
    value?: string | string[];
  },
): string {
  let summary = getCollectedSummary(patientCase);

  if (draft?.fieldKey && draft.value !== undefined) {
    const val = Array.isArray(draft.value) ? draft.value.join(", ") : String(draft.value);
    if (val.trim()) {
      summary += `\n[in progress — ${draft.fieldKey}]: ${val}`;
    }
  }

  return summary;
}

export const CLINICAL_DIAGNOSIS_SYSTEM = `Senior clinician teaching medical students. Return ONLY valid JSON:
{
  "primaryDiagnosis": "string",
  "clinicalReasoningSummary": "2-3 sentences explaining your reasoning",
  "differentials": [{
    "diagnosis": "string",
    "likelihood": "high|moderate|low",
    "reasoning": "why this is considered",
    "whyNotPrimary": "why it is less likely than primary",
    "keyFeatures": ["supporting or refuting features"]
  }],
  "redFlags": [{"flag":"string","whyItMatters":"string"}],
  "investigations": ["string"],
  "management": ["string"],
  "teachingPoints": ["string"]
}
Be educational. Include 3-5 differentials ranked by likelihood. Do NOT invent findings not in the case.`;

export function diagnosisToInsight(diagnosis: DiagnosisResult): ClinicalAiInsight {
  const likelihoodMap: Record<string, "high" | "moderate" | "low"> = {
    high: "high",
    moderate: "moderate",
    low: "low",
  };

  const confidenceFromLikelihood = (likelihood: string, index: number): number => {
    const base = likelihood.toLowerCase().includes("high")
      ? 75
      : likelihood.toLowerCase().includes("low")
        ? 25
        : 50;
    return Math.max(10, base - index * 8);
  };

  const differentials = diagnosis.differentials.map((d, i) => ({
    diagnosis: d.diagnosis,
    likelihood:
      likelihoodMap[d.likelihood.toLowerCase()] ??
      (i === 0 ? "high" : i < 3 ? "moderate" : "low"),
    reasoning: d.reasoning,
    confidence: confidenceFromLikelihood(d.likelihood, i),
  }));

  const urgency: ClinicalAiInsight["urgency"] =
    diagnosis.redFlags.length > 0 &&
    (Array.isArray(diagnosis.redFlags)
      ? diagnosis.redFlags.some((r) =>
          typeof r === "string"
            ? /shock|airway|unconscious|hemodynamic/i.test(r)
            : /shock|airway|unconscious|hemodynamic/i.test(r.flag),
        )
      : false)
      ? "emergency"
      : differentials[0]?.likelihood === "high"
        ? "stable"
        : "stable";

  return {
    leadingDiagnosis: diagnosis.primaryDiagnosis,
    reasoning: diagnosis.clinicalReasoningSummary,
    urgency,
    differentials,
    suggestedInvestigations: diagnosis.investigations.slice(0, 4).map((test) => ({
      test,
      rationale: "Supports or excludes leading differentials",
    })),
    nextClinicalFocus: diagnosis.teachingPoints[0],
  };
}
