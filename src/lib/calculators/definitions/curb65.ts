import type { CalculatorDefinition, CalculatorResult } from "../types";

export const curb65: CalculatorDefinition = {
  slug: "curb-65",
  title: "CURB-65 Score",
  shortName: "CURB-65",
  description:
    "Predicts 30-day mortality in community-acquired pneumonia and guides admission decisions.",
  category: "respiratory",
  icon: "🫁",
  clinicalApplication:
    "Used in ED and primary care to triage CAP — score 0–1 go home, 2 short-stay unit, 3+ urgent admission.",
  inputs: [
    { id: "confusion", label: "New confusion", type: "boolean" },
    { id: "urea", label: "Urea > 7 mmol/L (BUN > 20 mg/dL)", type: "boolean" },
    { id: "rr", label: "Respiratory rate ≥ 30/min", type: "boolean" },
    { id: "bp", label: "SBP < 90 or DBP ≤ 60 mmHg", type: "boolean" },
    { id: "age", label: "Age ≥ 65 years", type: "boolean" },
  ],
  calculate: (values) => {
    const score = [
      values.confusion, values.urea, values.rr, values.bp, values.age,
    ].filter(Boolean).length;

    let severity: CalculatorResult["severity"] = "low";
    let label = "Low risk";
    if (score >= 3) { severity = "severe"; label = "Severe (high mortality)"; }
    else if (score === 2) { severity = "moderate"; label = "Moderate risk"; }

    return {
      score,
      maxScore: 5,
      severity,
      label,
      interpretation: `CURB-65 ${score}/5 — ${label}.`,
      clinicalSignificance:
        "0–1: mortality <3%, outpatient. 2: mortality ~9%, short-stay. 3+: mortality 15–40%, urgent admission.",
      limitations:
        "Does not account for comorbidities, hypoxia, or social factors. May underestimate severity in young adults. Not for HAP or immunocompromised.",
      details: [
        { label: "Confusion", value: values.confusion ? "Yes" : "No" },
        { label: "Urea > 7", value: values.urea ? "Yes" : "No" },
        { label: "RR ≥ 30", value: values.rr ? "Yes" : "No" },
        { label: "Low BP", value: values.bp ? "Yes" : "No" },
        { label: "Age ≥ 65", value: values.age ? "Yes" : "No" },
      ],
    };
  },
};
