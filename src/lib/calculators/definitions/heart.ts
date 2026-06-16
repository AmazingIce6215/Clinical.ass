import type { CalculatorDefinition, CalculatorResult } from "../types";

export const heart: CalculatorDefinition = {
  slug: "heart-score",
  title: "HEART Score",
  shortName: "HEART",
  description:
    "Estimates the 6-week risk of major adverse cardiac events (MACE) in patients presenting with chest pain.",
  category: "cardiology",
  icon: "❤️",
  clinicalApplication:
    "Used in ED for chest pain triage. Score 0–3: low risk, consider early discharge. Score 4–6: moderate risk, admit for observation. Score 7–10: high risk, early invasive strategy.",
  inputs: [
    {
      id: "history",
      label: "History (typical chest pain features)",
      type: "select",
      options: [
        { label: "Non-suspicious or non-cardiac pain", value: "0", points: 0 },
        { label: "Moderately suspicious", value: "1", points: 1 },
        { label: "Highly suspicious / typical anginal pain", value: "2", points: 2 },
      ],
    },
    {
      id: "ecg",
      label: "ECG",
      type: "select",
      options: [
        { label: "Normal", value: "0", points: 0 },
        { label: "Non-specific repolarisation abnormality", value: "1", points: 1 },
        { label: "Significant ST depression / LBBB / new changes", value: "2", points: 2 },
      ],
    },
    {
      id: "age",
      label: "Age",
      type: "select",
      options: [
        { label: "< 45 years", value: "0", points: 0 },
        { label: "45–64 years", value: "1", points: 1 },
        { label: "≥ 65 years", value: "2", points: 2 },
      ],
    },
    {
      id: "risk_factors",
      label: "Risk Factors",
      type: "select",
      options: [
        { label: "None known", value: "0", points: 0 },
        { label: "1–2 risk factors", value: "1", points: 1 },
        { label: "≥3 risk factors or history of CAD", value: "2", points: 2 },
      ],
      helpText: "Risk factors: DM, HTN, hypercholesterolaemia, smoking, family history of CAD",
    },
    {
      id: "troponin",
      label: "Initial Troponin",
      type: "select",
      options: [
        { label: "Normal (≤ 99th percentile)", value: "0", points: 0 },
        { label: "1–3× upper limit of normal", value: "1", points: 1 },
        { label: "≥ 3× upper limit of normal", value: "2", points: 2 },
      ],
    },
  ],
  calculate: (values) => {
    const h = Number(values.history) || 0;
    const e = Number(values.ecg) || 0;
    const a = Number(values.age) || 0;
    const r = Number(values.risk_factors) || 0;
    const t = Number(values.troponin) || 0;
    const score = h + e + a + r + t;

    let severity: CalculatorResult["severity"] = "low";
    let label = "Low risk (MACE 1.7%)";
    if (score >= 7) { severity = "high"; label = "High risk (MACE 50–65%)"; }
    else if (score >= 4) { severity = "moderate"; label = "Moderate risk (MACE 20%)"; }

    return {
      score,
      maxScore: 10,
      severity,
      label,
      interpretation: `HEART score ${score}/10 — ${label}.`,
      clinicalSignificance:
        "0–3: 6-week MACE risk ~1.7% — consider early discharge. 4–6: ~20% — admit for observation and serial troponins. 7–10: ~50–65% — early invasive management indicated.",
      limitations:
        "Validated primarily in ED chest pain. Requires serial troponin. The 'history' component is subjective. May not apply to STEMI patients.",
      details: [
        { label: "History", value: `${h}/2` },
        { label: "ECG", value: `${e}/2` },
        { label: "Age", value: `${a}/2` },
        { label: "Risk Factors", value: `${r}/2` },
        { label: "Troponin", value: `${t}/2` },
      ],
    };
  },
};
