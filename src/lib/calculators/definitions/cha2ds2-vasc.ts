import type { CalculatorDefinition, CalculatorResult } from "../types";

export const cha2ds2Vasc: CalculatorDefinition = {
  slug: "cha2ds2-vasc",
  title: "CHA₂DS₂-VASc Score",
  shortName: "CHA₂DS₂-VASc",
  description:
    "Estimates thromboembolic risk in adults with atrial fibrillation for use in anticoagulation discussions.",
  category: "cardiology",
  icon: "activity",
  clinicalApplication:
    "Supports thromboembolic risk review and shared anticoagulation decisions in atrial fibrillation alongside current guidance and individual clinical factors.",
  evidence: {
    version: "CHA₂DS₂-VASc nine-point score",
    intendedPopulation:
      "Adults with atrial fibrillation or atrial flutter being assessed for thromboembolic risk.",
    exclusions: [
      "Mechanical prosthetic heart valves or moderate-to-severe mitral stenosis",
      "Patients without documented atrial fibrillation or atrial flutter",
      "Children and young people under 18 years",
      "Use as a substitute for shared decision-making and current local anticoagulation guidance",
    ],
    references: [
      {
        title: "Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation",
        citation: "Lip GYH, et al. Chest. 2010;137(2):263–272.",
        url: "https://pubmed.ncbi.nlm.nih.gov/19762550/",
      },
      {
        title: "ESC Clinical Practice Guidelines for the management of atrial fibrillation",
        citation: "European Society of Cardiology. 2024 ESC guideline.",
        url: "https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/atrial-fibrillation/",
      },
    ],
    reviewedAt: "2026-07-14",
  },
  inputs: [
    { id: "chf", label: "CHF / LVEF ≤ 40% (+1)", type: "boolean" },
    { id: "htn", label: "Hypertension (+1)", type: "boolean" },
    { id: "age_75", label: "Age ≥ 75 years (+2)", type: "boolean" },
    { id: "diabetes", label: "Diabetes mellitus (+1)", type: "boolean" },
    { id: "stroke", label: "Stroke / TIA / thromboembolism (+2)", type: "boolean" },
    { id: "vascular", label: "Vascular disease (PAD, prior MI, aortic plaque) (+1)", type: "boolean" },
    { id: "age_65", label: "Age 65–74 years (+1)", type: "boolean" },
    { id: "female", label: "Female sex (+1)", type: "boolean" },
  ],
  calculate: (values) => {
    const pts = (v: unknown) => Number(Boolean(v));
    const score = pts(values.chf) + pts(values.htn) + pts(values.age_75) * 2
      + pts(values.diabetes) + pts(values.stroke) * 2 + pts(values.vascular)
      + pts(values.age_65) + pts(values.female);

    let severity: CalculatorResult["severity"] = "low";
    let label = "Lower score band";
    if (score >= 5) { severity = "high"; label = "Higher score band"; }
    else if (score >= 2) { severity = "moderate"; label = "Intermediate score band"; }

    return {
      score,
      maxScore: 9,
      severity,
      label,
      interpretation: `CHA₂DS₂-VASc score ${score}/9 — ${label}.`,
      clinicalSignificance:
        "Thromboembolic risk generally rises as the score increases. Current guidelines interpret sex as a risk modifier and apply treatment thresholds within a broader review of bleeding risk, contraindications, and patient preferences.",
      recommendations:
        score === 0
          ? ["Review whether antithrombotic therapy is indicated under the current atrial-fibrillation guideline.", "Reassess thromboembolic risk periodically and when clinical risk factors change."]
          : score === 1
            ? ["Review anticoagulation benefit and uncertainty using current sex-specific guideline thresholds.", "Female sex alone is generally treated as a risk modifier rather than an independent indication.", "Use shared decision-making that includes stroke risk, bleeding risk, and patient preferences."]
            : ["Review the indication and choice of oral anticoagulation using current guidance and individual contraindications.", "Identify and address modifiable bleeding risks rather than using a bleeding score alone to withhold treatment.", "Plan follow-up appropriate to the selected therapy, renal function, adherence, and adverse effects."],
      limitations:
        "Does not include bleeding risk — always balance with HAS-BLED score. Does not capture time in AF or other stroke risk factors (e.g., renal impairment, cancer).",
      details: [
        { label: "CHF/LVEF ≤40%", value: values.chf ? "+1" : "0" },
        { label: "Hypertension", value: values.htn ? "+1" : "0" },
        { label: "Age ≥75", value: values.age_75 ? "+2" : "0" },
        { label: "Diabetes", value: values.diabetes ? "+1" : "0" },
        { label: "Stroke/TIA", value: values.stroke ? "+2" : "0" },
        { label: "Vascular disease", value: values.vascular ? "+1" : "0" },
        { label: "Age 65–74", value: values.age_65 ? "+1" : "0" },
        { label: "Female sex", value: values.female ? "+1" : "0" },
      ],
    };
  },
};
