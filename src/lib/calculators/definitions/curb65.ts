import type { CalculatorDefinition, CalculatorResult } from "../types";

export const curb65: CalculatorDefinition = {
  slug: "curb-65",
  title: "CURB-65 Score",
  shortName: "CURB-65",
  description:
    "Estimates 30-day mortality risk in community-acquired pneumonia to support initial severity assessment.",
  category: "respiratory",
  icon: "air-vent",
  clinicalApplication:
    "Supports initial severity assessment in community-acquired pneumonia alongside oxygenation, comorbidity, social factors, and the local care pathway.",
  evidence: {
    version: "CURB-65 five-item score",
    intendedPopulation:
      "Adults with a clinical diagnosis of community-acquired pneumonia assessed at first presentation.",
    exclusions: [
      "Children and young people under 18 years",
      "Hospital-acquired or ventilator-associated pneumonia",
      "Severe immunosuppression or another condition requiring an independent admission decision",
    ],
    references: [
      {
        title: "Defining community acquired pneumonia severity on presentation to hospital",
        citation: "Lim WS, et al. Thorax. 2003;58(5):377–382.",
        url: "https://thorax.bmj.com/content/58/5/377",
      },
      {
        title: "Pneumonia: diagnosis and management",
        citation: "National Institute for Health and Care Excellence. NICE guideline NG250.",
        url: "https://www.nice.org.uk/guidance/ng250",
      },
    ],
    reviewedAt: "2026-07-14",
  },
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
    if (score >= 3) { severity = "severe"; label = "High-severity band"; }
    else if (score === 2) { severity = "moderate"; label = "Moderate risk"; }

    return {
      score,
      maxScore: 5,
      severity,
      label,
      interpretation: `CURB-65 ${score}/5 — ${label}.`,
      clinicalSignificance:
        "In the derivation cohorts, higher score bands were associated with increasing 30-day mortality. Disposition should also account for oxygenation, comorbidity, complications, oral intake, pregnancy, and social circumstances.",
      recommendations:
        score <= 1
          ? ["Review whether outpatient care is appropriate after considering oxygenation, comorbidity, oral intake, and social circumstances.", "Select antimicrobial therapy using the current local community-acquired-pneumonia guideline.", "Provide follow-up and clear safety-net advice for worsening breathlessness, fever, or confusion."]
          : score === 2
            ? ["Consider supervised hospital assessment or short-stay care based on the complete severity assessment.", "Review locally recommended investigations and antimicrobial therapy.", "Reassess clinical trajectory and escalate care if deterioration occurs."]
            : ["Urgent senior assessment and hospital-level care are commonly required for severe presentations.", "Use the local severe-pneumonia and antimicrobial protocol, including sepsis assessment where relevant.", "Review the need for critical-care support if respiratory or haemodynamic instability develops."],
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
