import type { CalculatorDefinition, CalculatorResult } from "../types";

export const cha2ds2Vasc: CalculatorDefinition = {
  slug: "cha2ds2-vasc",
  title: "CHA₂DS₂-VASc Score",
  shortName: "CHA₂DS₂-VASc",
  description:
    "Estimates annual stroke risk in patients with atrial fibrillation to guide anticoagulation decisions.",
  category: "cardiology",
  icon: "❤️",
  clinicalApplication:
    "Used to determine need for anticoagulation in AF. Score ≥2 (men) or ≥3 (women) generally warrants OAC therapy.",
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
    let label = "Low risk (annual stroke ~0.2%)";
    if (score >= 5) { severity = "high"; label = "High risk (annual stroke ~5–10%)"; }
    else if (score >= 2) { severity = "moderate"; label = "Moderate risk (annual stroke ~2–4%)"; }

    return {
      score,
      maxScore: 9,
      severity,
      label,
      interpretation: `CHA₂DS₂-VASc score ${score}/9 — ${label}.`,
      clinicalSignificance:
        `${score <= 1 ? `${score === 0 ? "CHA₂DS₂-VASc 0: consider no antithrombotic therapy." : "CHA₂DS₂-VASc 1: consider OAC in women only if other risk factors present."}` : `Score ≥2 (men) / ≥3 (women): oral anticoagulation recommended (DOAC or warfarin). Adjusted stroke rate: ${["0.2%", "0.6%", "2.2%", "3.2%", "4.0%", "5.7%", "7.8%", "9.6%", "10.8%", "12.2%"][Math.min(score, 9)]} per year.`}`,
      recommendations:
        score === 0
          ? ["Consider no antithrombotic therapy — annual stroke risk ~0.2%.", "Reassess risk annually and whenever new risk factors develop."]
          : score === 1
            ? ["Consider OAC (DOAC preferred) for men with one risk factor.", "For women, OAC only if additional risk factors beyond female sex.", "Discuss shared decision-making with patient."]
            : ["Start oral anticoagulation — DOAC (apixaban, rivaroxaban, edoxaban, dabigatran) preferred over warfarin.", "Assess bleeding risk with HAS-BLED score before initiating.", "Schedule follow-up in 4 weeks to check adherence, side effects, and renal function."],
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
