import type { CalculatorDefinition, CalculatorResult } from "../types";

export const wellsDVT: CalculatorDefinition = {
  slug: "wells-dvt",
  title: "Wells Criteria for DVT",
  shortName: "Wells DVT",
  description:
    "Pre-test probability assessment for lower extremity deep vein thrombosis.",
  category: "cardiology",
  icon: "❤️",
  clinicalApplication:
    "First-line clinical rule for suspected DVT. Low prob + neg D-dimer rules out DVT.",
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
        "≤0: DVT ~5% — D-dimer. 1–2: ~17% — D-dimer, ultrasound if positive. ≥3: ~53% — venous duplex ultrasound.",
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
