import type { CalculatorDefinition, CalculatorResult } from "../types";

export const wellsPE: CalculatorDefinition = {
  slug: "wells-pe",
  title: "Wells Criteria for PE",
  shortName: "Wells PE",
  description:
    "Pre-test probability for pulmonary embolism using clinical signs, risk factors, and alternative diagnosis likelihood.",
  category: "cardiology",
  icon: "❤️",
  clinicalApplication:
    "First-line risk stratification for suspected PE in ED. Low prob + neg D-dimer rules out PE.",
  inputs: [
    { id: "dvt_sx", label: "Clinical signs of DVT (+3)", type: "boolean", helpText: "Unilateral leg swelling, pain, tenderness" },
    { id: "pe_likely", label: "PE is #1 diagnosis or equally likely (+3)", type: "boolean", helpText: "Based on H&P — is PE the most likely?" },
    { id: "hr", label: "Heart rate > 100 bpm (+1.5)", type: "boolean" },
    { id: "immob", label: "Immobilisation/surgery within 4 weeks (+1.5)", type: "boolean" },
    { id: "prior_vte", label: "Previous DVT or PE (+1.5)", type: "boolean" },
    { id: "hemoptysis", label: "Haemoptysis (+1)", type: "boolean" },
    { id: "malignancy", label: "Active malignancy (+1)", type: "boolean", helpText: "Treatment, palliative, or <6 months since diagnosis" },
  ],
  calculate: (values) => {
    const pts = (v: unknown) => Number(Boolean(v));
    const score = pts(values.dvt_sx) * 3 + pts(values.pe_likely) * 3
      + pts(values.hr) * 1.5 + pts(values.immob) * 1.5
      + pts(values.prior_vte) * 1.5 + pts(values.hemoptysis) * 1
      + pts(values.malignancy) * 1;

    let severity: CalculatorResult["severity"] = "low";
    let label = "Low probability";
    if (score > 6) { severity = "high"; label = "High probability"; }
    else if (score >= 2) { severity = "moderate"; label = "Moderate probability"; }

    return {
      score,
      maxScore: 12.5,
      severity,
      label,
      interpretation: `Wells PE score ${score.toFixed(1)} — ${label}.`,
      clinicalSignificance:
        `<2: PE ~3.6% — D-dimer first. 2–6: ~14% — D-dimer; CTPA if positive. >6: ~50% — direct to CTPA.`,
      limitations:
        "'PE most likely' is subjective. Not validated in pregnancy. D-dimer is age-adjusted >50y.",
      details: [
        { label: "DVT signs", value: values.dvt_sx ? "+3" : "0" },
        { label: "PE most likely", value: values.pe_likely ? "+3" : "0" },
        { label: "HR > 100", value: values.hr ? "+1.5" : "0" },
        { label: "Immobilisation", value: values.immob ? "+1.5" : "0" },
        { label: "Prior DVT/PE", value: values.prior_vte ? "+1.5" : "0" },
        { label: "Haemoptysis", value: values.hemoptysis ? "+1" : "0" },
        { label: "Active malignancy", value: values.malignancy ? "+1" : "0" },
      ],
    };
  },
};
