import type { CalculatorDefinition, CalculatorResult } from "../types";

export const hasBled: CalculatorDefinition = {
  slug: "has-bled",
  title: "HAS-BLED Score",
  shortName: "HAS-BLED",
  description:
    "Estimates 1-year major bleeding risk in patients with atrial fibrillation on anticoagulation.",
  category: "cardiology",
  icon: "🩸",
  clinicalApplication:
    "Used alongside CHA₂DS₂-VASc to weigh bleeding risk vs stroke prevention benefit. Score ≥3 indicates caution.",
  inputs: [
    { id: "htn", label: "Uncontrolled hypertension (SBP > 160 mmHg) (+1)", type: "boolean" },
    { id: "renal", label: "Abnormal renal function (dialysis, transplant, Cr > 2.26) (+1)", type: "boolean" },
    { id: "liver", label: "Abnormal liver function (cirrhosis, bilirubin >2×, AST/ALT >3×) (+1)", type: "boolean" },
    { id: "stroke", label: "History of stroke (+1)", type: "boolean" },
    { id: "bleeding", label: "Bleeding history or predisposition (+1)", type: "boolean" },
    { id: "labile_inr", label: "Labile INR (<60% time in therapeutic range) (+1)", type: "boolean" },
    { id: "elderly", label: "Elderly > 65 years (+1)", type: "boolean" },
    { id: "drugs", label: "Anti-platelet drugs or NSAIDs (+1)", type: "boolean" },
    { id: "alcohol", label: "Alcohol excess (≥8 units/week) (+1)", type: "boolean" },
  ],
  calculate: (values) => {
    const pts = (v: unknown) => Number(Boolean(v));
    const score = pts(values.htn) + pts(values.renal) + pts(values.liver)
      + pts(values.stroke) + pts(values.bleeding) + pts(values.labile_inr)
      + pts(values.elderly) + pts(values.drugs) + pts(values.alcohol);

    let severity: CalculatorResult["severity"] = "low";
    let label = "Low bleeding risk";
    if (score >= 5) { severity = "critical"; label = "Very high bleeding risk"; }
    else if (score >= 3) { severity = "high"; label = "High bleeding risk"; }

    return {
      score,
      maxScore: 9,
      severity,
      label,
      interpretation: `HAS-BLED score ${score}/9 — ${label}.`,
      clinicalSignificance:
        "Score 0–2: low risk (bleeds/100 patient-years: 1–4). Score ≥3: high risk (6–15 bleeds/100 patient-years); address modifiable risk factors and consider closer monitoring. A high score alone should not preclude OAC — balance with CHA₂DS₂-VASc.",
      recommendations:
        score < 3
          ? ["Bleeding risk is low — OAC is safe if CHA₂DS₂-VASc indicates benefit.", "Monitor renal function and blood pressure at follow-up visits.", "Review medication list for interacting drugs (NSAIDs, antiplatelets)."]
          : ["Address modifiable risk factors: uncontrolled HTN, NSAID use, alcohol excess, labile INR.", "If on warfarin, improve TTR — consider switching to DOAC if consistently labile.", "A high HAS-BLED is not a contraindication to OAC — assess net clinical benefit with CHA₂DS₂-VASc.", "Schedule closer monitoring — 1-month follow-up after OAC initiation."],
      limitations:
        "Moderate predictive value (c-statistic ~0.65). Not validated outside AF. 'Labile INR' criterion may not apply to DOACs. Does not capture fall risk or frailty.",
      details: [
        { label: "Uncontrolled HTN", value: values.htn ? "+1" : "0" },
        { label: "Renal disease", value: values.renal ? "+1" : "0" },
        { label: "Liver disease", value: values.liver ? "+1" : "0" },
        { label: "Stroke history", value: values.stroke ? "+1" : "0" },
        { label: "Bleeding history", value: values.bleeding ? "+1" : "0" },
        { label: "Labile INR", value: values.labile_inr ? "+1" : "0" },
        { label: "Elderly >65", value: values.elderly ? "+1" : "0" },
        { label: "Drugs (anti-platelet/NSAIDs)", value: values.drugs ? "+1" : "0" },
        { label: "Alcohol excess", value: values.alcohol ? "+1" : "0" },
      ],
    };
  },
};
