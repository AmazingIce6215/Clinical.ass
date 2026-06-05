import type { DiagnosisResult, PatientCase, ReasoningNode } from "./types";

export function buildReasoningTree(
  patientCase: PatientCase,
  diagnosis: DiagnosisResult,
): ReasoningNode {
  const complaints = patientCase.chiefComplaints;
  const primaryComplaint = complaints.length > 0 ? complaints.join(", ") : "Presentation";
  const primary = diagnosis.primaryDiagnosis;

  // Build pathway nodes from differentials data
  const pathwayNodes: ReasoningNode[] = [];

  // Collect all differentials and the primary diagnosis as pathway children
  const allDx: Array<{
    label: string;
    likelihood: string;
    supportingFindings: string[];
    findingsAgainst: string[];
    reasoning: string;
    whyNotPrimary?: string;
    isPrimary: boolean;
  }> = [
    {
      label: primary,
      likelihood: "high",
      supportingFindings: diagnosis.differentials.find(
        (d) => d.diagnosis === primary,
      )?.supportingFindings ?? [],
      findingsAgainst: diagnosis.differentials.find(
        (d) => d.diagnosis === primary,
      )?.findingsAgainst ?? [],
      reasoning: diagnosis.clinicalReasoningSummary,
      isPrimary: true,
    },
    ...diagnosis.differentials
      .filter((d) => d.diagnosis !== primary)
      .map((d) => ({
        label: d.diagnosis,
        likelihood: d.likelihood,
        supportingFindings: d.supportingFindings ?? [],
        findingsAgainst: d.findingsAgainst ?? [],
        reasoning: d.reasoning,
        whyNotPrimary: d.whyNotPrimary,
        isPrimary: false,
      })),
  ];

  // Group into broad pathway categories based on the primary complaint
  const pathways = categorizePathways(complaints, allDx);

  for (const pw of pathways) {
    const children: ReasoningNode[] = pw.diagnoses.map((dx) => ({
      label: dx.label,
      type: dx.isPrimary ? "final" : "diagnosis",
      supporting: dx.supportingFindings.length > 0 ? dx.supportingFindings : undefined,
      against: dx.findingsAgainst.length > 0 ? dx.findingsAgainst : undefined,
      reasoning: dx.reasoning,
      ...(dx.whyNotPrimary && !dx.isPrimary
        ? { children: [{ label: dx.whyNotPrimary, type: "elimination" as const }] }
        : {}),
    }));

    pathwayNodes.push({
      label: pw.name,
      type: "pathway",
      reasoning: pw.reasoning,
      children,
    });
  }

  // Build elimination nodes for diagnoses ruled out
  const eliminated = allDx.filter(
    (dx): dx is typeof dx & { whyNotPrimary: string } =>
      !dx.isPrimary && !!dx.whyNotPrimary,
  );
  let eliminationNode: ReasoningNode | undefined;
  if (eliminated.length > 0) {
    eliminationNode = {
      label: "Ruled out because",
      type: "elimination",
      children: eliminated.map((dx) => ({
        label: dx.label,
        type: "elimination",
        reasoning: dx.whyNotPrimary,
      })),
    };
  }

  // Build the final summary node
  const finalNode: ReasoningNode = {
    label: primary,
    type: "final",
    reasoning: `Most likely because:\n${buildTopReasons(allDx, primary)}`,
    supporting: allDx
      .find((dx) => dx.isPrimary)
      ?.supportingFindings?.slice(0, 5),
  };

  const tree: ReasoningNode = {
    label: primaryComplaint,
    type: "symptom",
    children: [
      ...pathwayNodes,
      ...(eliminationNode ? [eliminationNode] : []),
      finalNode,
    ],
  };

  return tree;
}

interface DxEntry {
  label: string;
  likelihood: string;
  supportingFindings: string[];
  findingsAgainst: string[];
  reasoning: string;
  whyNotPrimary?: string;
  isPrimary: boolean;
}

interface PathwayGroup {
  name: string;
  reasoning: string;
  diagnoses: DxEntry[];
}

function categorizePathways(
  complaints: string[],
  allDx: DxEntry[],
): PathwayGroup[] {
  const text = complaints.join(" ").toLowerCase();

  // Map systems based on complaint keywords
  const systemMap: Record<string, string[]> = {
    Cardiac: ["chest pain", "cp", "palpitations", "dyspnoea", "shortness of breath", "syncope"],
    Respiratory: ["cough", "shortness of breath", "dyspnoea", "wheeze", "haemoptysis", "sob", "breathless"],
    Gastrointestinal: ["abdominal pain", "nausea", "vomit", "diarrhoea", "dysphagia", "heartburn", "gerd"],
    Musculoskeletal: ["pain", "back pain", "joint", "myalgia", "injury", "trauma"],
    Infectious: ["fever", "rash", "sepsis", "infection", "cellulitis"],
    Neurological: ["headache", "dizziness", "seizure", "stroke", "confusion", "syncope", "vertigo"],
    Vascular: ["swelling", "dvt", "pe", "claudication", "oedema"],
    Renal: ["oliguria", "dysuria", "haematuria", "loin pain", "uti"],
  };

  // Find relevant systems based on complaint keywords
  const relevantSystems = Object.entries(systemMap)
    .filter(([, keywords]) => keywords.some((kw) => text.includes(kw)))
    .map(([name]) => name);

  if (relevantSystems.length === 0) {
    // Default fallback grouping
    return allDx.length > 0
      ? [{ name: "Primary diagnostic pathway", reasoning: "Leading considerations based on presentation", diagnoses: allDx }]
      : [];
  }

  // Distribute diagnoses into pathway groups — simple split
  const mid = Math.ceil(allDx.length / relevantSystems.length) || 1;
  const pathways: PathwayGroup[] = relevantSystems.map((sys, i) => {
    const start = i * mid;
    const end = start + mid;
    const dx = allDx.slice(start, end);
    return {
      name: sys,
      reasoning: `Evaluated based on ${complaints.join(" & ")} presentation`,
      diagnoses: dx,
    };
  });

  return pathways;
}

function buildTopReasons(
  allDx: DxEntry[],
  primary: string,
): string {
  const primaryDx = allDx.find((dx) => dx.isPrimary);
  if (!primaryDx) return "Leading diagnosis based on clinical presentation";

  const reasons: string[] = [];

  if (primaryDx.supportingFindings.length > 0) {
    reasons.push(`• Supporting features present: ${primaryDx.supportingFindings.slice(0, 3).join(", ")}`);
  }

  if (primaryDx.reasoning) {
    reasons.push(`• ${primaryDx.reasoning}`);
  }

  // Add why others ruled out
  const ruledOut = allDx.filter(
    (dx): dx is typeof dx & { whyNotPrimary: string } =>
      !dx.isPrimary && !!dx.whyNotPrimary,
  );
  if (ruledOut.length > 0) {
    reasons.push(`• Alternative diagnoses ruled out: ${ruledOut.map((dx) => `${dx.label} (${dx.whyNotPrimary})`).join("; ")}`);
  }

  if (reasons.length === 0) {
    reasons.push("• Best fit with available clinical data");
  }

  return reasons.join("\n");
}