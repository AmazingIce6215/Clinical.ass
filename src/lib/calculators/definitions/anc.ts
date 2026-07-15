import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const anc: CalculatorDefinition = {
  slug: "absolute-neutrophil-count",
  title: "Absolute Neutrophil Count (ANC)",
  shortName: "ANC",
  description:
    "Calculates absolute neutrophil count from WBC and neutrophil percentage (segs ± bands).",
  category: "hematology",
  icon: "flask-conical",
  clinicalApplication:
    "Neutropenia grading and febrile neutropenia risk context in oncology/ID teaching.",
  evidence: {
    version: "ANC = WBC × (% segs + % bands) / 100",
    intendedPopulation: "Patients with CBC differential available.",
    exclusions: [
      "Automated differentials without clinical correlation in critically ill patients",
      "Use alone for fever management without local febrile neutropenia pathways",
    ],
    references: [
      {
        title: "Common Terminology Criteria for Adverse Events (neutropenia grading context)",
        citation: "NCI CTCAE educational reference for ANC thresholds.",
        url: "https://ctep.cancer.gov/protocoldevelopment/electronic_applications/ctc.htm",
      },
      {
        title: "IDSA febrile neutropenia guidelines",
        citation: "Freifeld AG, et al. Clin Infect Dis. 2011;52(4):e56–e93.",
        url: "https://pubmed.ncbi.nlm.nih.gov/21258094/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "wbc",
      label: "WBC",
      type: "number",
      suffix: "×10⁹/L",
      min: 0.1,
      max: 200,
      step: 0.1,
    },
    {
      id: "segs",
      label: "Segmented neutrophils",
      type: "number",
      suffix: "%",
      min: 0,
      max: 100,
      step: 0.1,
    },
    {
      id: "bands",
      label: "Bands (optional)",
      type: "number",
      suffix: "%",
      min: 0,
      max: 100,
      step: 0.1,
      required: false,
    },
  ],
  calculate: (values) => {
    const wbc = asNumber(values.wbc);
    const segs = asNumber(values.segs);
    const bands =
      values.bands === "" || values.bands === undefined || values.bands === null
        ? 0
        : asNumber(values.bands);
    const value = wbc * ((segs + bands) / 100);
    let severity: "low" | "moderate" | "high" | "severe" | "critical" = "low";
    let label = "ANC not in severe neutropenia band";
    if (value < 0.1) {
      severity = "critical";
      label = "Profound neutropenia band (ANC < 0.1)";
    } else if (value < 0.5) {
      severity = "severe";
      label = "Severe neutropenia band (ANC < 0.5)";
    } else if (value < 1.0) {
      severity = "high";
      label = "Moderate neutropenia band (ANC < 1.0)";
    } else if (value < 1.5) {
      severity = "moderate";
      label = "Mild neutropenia band (ANC < 1.5)";
    }
    return formulaResult({
      value,
      unit: "×10⁹/L",
      digits: 2,
      label,
      severity,
      interpretation: `ANC ${roundTo(value, 2)} ×10⁹/L.`,
      clinicalSignificance:
        "ANC <0.5 ×10⁹/L defines severe neutropenia and drives febrile neutropenia urgency with fever.",
      limitations:
        "Does not assess neutrophil function. Manual differentials may differ from automated counts.",
      details: [
        { label: "WBC", value: `${wbc}` },
        { label: "Segs %", value: `${segs}` },
        { label: "Bands %", value: `${bands}` },
        { label: "ANC", value: `${roundTo(value, 2)}` },
      ],
      recommendations: [
        "With fever and severe neutropenia, follow febrile neutropenia pathways urgently.",
        "Review drugs, marrow pathology, and infection risk factors.",
      ],
    });
  },
};
