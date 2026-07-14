import type { CalculatorDefinition, CalculatorResult } from "../types";

export const wellsPE: CalculatorDefinition = {
  slug: "wells-pe",
  title: "Wells Criteria for PE",
  shortName: "Wells PE",
  description:
    "Pre-test probability for pulmonary embolism using clinical signs, risk factors, and alternative diagnosis likelihood.",
  category: "cardiology",
  icon: "activity",
  clinicalApplication:
    "Supports pre-test probability assessment for suspected pulmonary embolism before D-dimer or imaging within a validated local diagnostic pathway.",
  evidence: {
    version: "Three-tier Wells PE model",
    intendedPopulation:
      "Haemodynamically stable adults with clinically suspected acute pulmonary embolism before diagnostic testing.",
    exclusions: [
      "Children and young people under 18 years",
      "Pregnancy or the immediate postpartum period",
      "Haemodynamic instability requiring urgent assessment and treatment",
      "Patients already receiving therapeutic anticoagulation",
    ],
    references: [
      {
        title: "Excluding pulmonary embolism at the bedside without diagnostic imaging",
        citation: "Wells PS, et al. Ann Intern Med. 2001;135(2):98–107.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11453709/",
      },
      {
        title: "Venous thromboembolic diseases: diagnosis, management and thrombophilia testing",
        citation: "National Institute for Health and Care Excellence. NICE guideline NG158.",
        url: "https://www.nice.org.uk/guidance/ng158",
      },
    ],
    reviewedAt: "2026-07-14",
  },
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
        "This implementation uses the published three-tier model: less than 2 is low, 2–6 is moderate, and greater than 6 is high pre-test probability. Testing decisions depend on the validated pathway, assay, age adjustment, contraindications, and local guidance.",
      recommendations:
        score < 2
          ? ["A high-sensitivity D-dimer may be appropriate within a validated local pathway.", "Interpret a negative result only with the assay, age adjustment, and pathway for which it is validated.", "Review imaging options with the responsible team if the D-dimer is positive or clinical concern persists."]
          : score <= 6
            ? ["Review whether D-dimer or direct imaging is indicated under the local PE pathway.", "Discuss discordant results or persistent clinical concern with a senior clinician and radiology.", "If PE is confirmed, review anticoagulation choice, contraindications, and severity using current guidance."]
            : ["Prompt definitive imaging and senior review are commonly considered when pre-test probability is high.", "Review interim anticoagulation only after assessing bleeding risk and following the local pathway.", "Assess haemodynamic severity and right-heart strain using the investigations appropriate to the presentation."],
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
