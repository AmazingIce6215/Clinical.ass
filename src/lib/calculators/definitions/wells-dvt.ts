import type { CalculatorDefinition, CalculatorResult } from "../types";

export const wellsDVT: CalculatorDefinition = {
  slug: "wells-dvt",
  title: "Wells Criteria for DVT",
  shortName: "Wells DVT",
  description:
    "Pre-test probability assessment for lower extremity deep vein thrombosis.",
  category: "cardiology",
  icon: "activity",
  clinicalApplication:
    "Supports pre-test probability assessment for suspected lower-extremity DVT before D-dimer or ultrasound within a validated local diagnostic pathway.",
  evidence: {
    version: "Three-tier Wells DVT model",
    intendedPopulation:
      "Adults with suspected acute lower-extremity deep vein thrombosis before diagnostic testing.",
    exclusions: [
      "Children and young people under 18 years",
      "Pregnancy or the immediate postpartum period",
      "Suspected upper-extremity thrombosis",
      "Patients already receiving therapeutic anticoagulation",
    ],
    references: [
      {
        title: "Value of assessment of pretest probability of deep-vein thrombosis in clinical management",
        citation: "Wells PS, et al. Lancet. 1997;350(9094):1795–1798.",
        url: "https://pubmed.ncbi.nlm.nih.gov/9428249/",
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
    { id: "cancer", label: "Active malignancy (+1)", type: "boolean" },
    { id: "paralysis", label: "Paralysis, paresis, or plaster cast (+1)", type: "boolean" },
    { id: "bedridden", label: "Bedridden >3d or surgery <12wk (+1)", type: "boolean" },
    { id: "tender", label: "Tenderness along deep veins (+1)", type: "boolean" },
    { id: "swollen", label: "Entire leg swollen (+1)", type: "boolean" },
    { id: "calf", label: "Calf swelling >3 cm vs asympt. leg (+1)", type: "boolean" },
    { id: "edema", label: "Pitting edema confined to symptomatic leg (+1)", type: "boolean" },
    { id: "collaterals", label: "Collateral superficial veins (+1)", type: "boolean" },
    { id: "alt_dx", label: "Alternative diagnosis more likely than DVT (-2)", type: "boolean" },
  ],
  calculate: (values) => {
    const pts = (v: unknown) => Number(Boolean(v));
    const score = pts(values.cancer) + pts(values.paralysis) + pts(values.bedridden)
      + pts(values.tender) + pts(values.swollen) + pts(values.calf)
      + pts(values.edema) + pts(values.collaterals) - pts(values.alt_dx) * 2;

    let severity: CalculatorResult["severity"] = "low";
    let label = "Low probability";
    if (score >= 3) { severity = "high"; label = "High probability"; }
    else if (score >= 1) { severity = "moderate"; label = "Moderate probability"; }

    return {
      score,
      maxScore: 9,
      severity,
      label,
      interpretation: `Wells DVT score ${score} — ${label}.`,
      clinicalSignificance:
        "This implementation uses the published three-tier model: 0 or less is low, 1–2 is moderate, and 3 or more is high pre-test probability. Diagnostic steps depend on the validated local pathway and access to D-dimer and ultrasound.",
      recommendations:
        score <= 0
          ? ["A D-dimer may be appropriate within a validated local DVT pathway.", "Review the need and timing of proximal venous ultrasound if the D-dimer is positive or concern persists.", "Consider alternative explanations for leg symptoms as part of the complete assessment."]
          : score <= 2
            ? ["Review whether D-dimer or ultrasound is indicated under the local DVT pathway.", "Interpret a negative D-dimer only in the population and pathway for which it is validated.", "If DVT is confirmed, review anticoagulation options and contraindications using current guidance."]
            : ["Prompt venous ultrasound and senior review are commonly considered when pre-test probability is high.", "Review interim anticoagulation only after assessing bleeding risk and following the local pathway.", "If DVT is confirmed, review clot extent, anticoagulation, and planned follow-up."],
      limitations:
        "'Alternative diagnosis' is subjective. Less validated in hospitalised patients. Does not distinguish proximal vs distal DVT.",
      details: [
        { label: "Active cancer", value: values.cancer ? "+1" : "0" },
        { label: "Paralysis/cast", value: values.paralysis ? "+1" : "0" },
        { label: "Bedridden/surgery", value: values.bedridden ? "+1" : "0" },
        { label: "Vein tenderness", value: values.tender ? "+1" : "0" },
        { label: "Entire leg swollen", value: values.swollen ? "+1" : "0" },
        { label: "Calf >3 cm", value: values.calf ? "+1" : "0" },
        { label: "Pitting edema", value: values.edema ? "+1" : "0" },
        { label: "Collateral veins", value: values.collaterals ? "+1" : "0" },
        { label: "Alt. Dx more likely", value: values.alt_dx ? "-2" : "0" },
      ],
    };
  },
};
