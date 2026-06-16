import type { CalculatorDefinition, CalculatorResult } from "../types";

export const sofa: CalculatorDefinition = {
  slug: "sofa",
  title: "SOFA Score",
  shortName: "SOFA",
  description:
    "Sequential Organ Failure Assessment quantifies organ dysfunction in critically ill patients and predicts mortality.",
  category: "critical-care",
  icon: "🆘",
  clinicalApplication:
    "Used in ICU to track organ failure over time. A change in SOFA ≥2 defines sepsis (Sepsis-3). Baseline <2 has mortality <10%, >15 has >80%.",
  inputs: [
    {
      id: "resp",
      label: "Respiration (PaO₂/FiO₂)",
      type: "select",
      options: [
        { label: "≥ 400 mmHg (0)", value: "0", points: 0 },
        { label: "< 400 mmHg (1)", value: "1", points: 1 },
        { label: "< 300 mmHg (2)", value: "2", points: 2 },
        { label: "< 200 mmHg on vent (3)", value: "3", points: 3 },
        { label: "< 100 mmHg on vent (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "coag",
      label: "Coagulation (Platelets ×10³/µL)",
      type: "select",
      options: [
        { label: "≥ 150 (0)", value: "0", points: 0 },
        { label: "< 150 (1)", value: "1", points: 1 },
        { label: "< 100 (2)", value: "2", points: 2 },
        { label: "< 50 (3)", value: "3", points: 3 },
        { label: "< 20 (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "liver",
      label: "Liver (Bilirubin µmol/L)",
      type: "select",
      options: [
        { label: "< 20 (0)", value: "0", points: 0 },
        { label: "20–32 (1)", value: "1", points: 1 },
        { label: "33–101 (2)", value: "2", points: 2 },
        { label: "102–204 (3)", value: "3", points: 3 },
        { label: "> 204 (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "cv",
      label: "Cardiovascular",
      type: "select",
      options: [
        { label: "MAP ≥ 70 mmHg (0)", value: "0", points: 0 },
        { label: "MAP < 70 mmHg (1)", value: "1", points: 1 },
        { label: "Dopamine ≤5 or dobutamine (2)", value: "2", points: 2 },
        { label: "Dopamine >5 or epi ≤0.1 (3)", value: "3", points: 3 },
        { label: "Dopamine >15 or epi >0.1 (4)", value: "4", points: 4 },
      ],
      helpText: "Vasopressor doses in µg/kg/min",
    },
    {
      id: "cns",
      label: "CNS (GCS)",
      type: "select",
      options: [
        { label: "15 (0)", value: "0", points: 0 },
        { label: "13–14 (1)", value: "1", points: 1 },
        { label: "10–12 (2)", value: "2", points: 2 },
        { label: "6–9 (3)", value: "3", points: 3 },
        { label: "< 6 (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "renal",
      label: "Renal (Creatinine µmol/L or UOP)",
      type: "select",
      options: [
        { label: "< 110 (0)", value: "0", points: 0 },
        { label: "110–170 (1)", value: "1", points: 1 },
        { label: "171–299 (2)", value: "2", points: 2 },
        { label: "300–440 or UOP <500 mL/d (3)", value: "3", points: 3 },
        { label: "> 440 or UOP <200 mL/d (4)", value: "4", points: 4 },
      ],
    },
  ],
  calculate: (values) => {
    const score = (Number(values.resp) || 0) + (Number(values.coag) || 0)
      + (Number(values.liver) || 0) + (Number(values.cv) || 0)
      + (Number(values.cns) || 0) + (Number(values.renal) || 0);

    let severity: CalculatorResult["severity"] = "low";
    let label = "Mild dysfunction";
    if (score >= 15) { severity = "critical"; label = "Critical — very high mortality"; }
    else if (score >= 10) { severity = "severe"; label = "Severe dysfunction"; }
    else if (score >= 6) { severity = "moderate"; label = "Moderate dysfunction"; }
    else if (score >= 2) { severity = "low"; label = "Mild dysfunction"; }

    return {
      score,
      maxScore: 24,
      severity,
      label,
      interpretation: `SOFA score ${score}/24 — ${label}.`,
      clinicalSignificance:
        "0: normal. ΔSOFA ≥2 = sepsis. Predicts ICU mortality: 0 (<10%), 2–5 (~20%), 6–9 (~40%), 10–14 (~60%), >15 (>80%). Trends matter more than single values.",
      limitations:
        "Requires labs and GCS — not a quick bedside tool. Does not account for pre-existing organ dysfunction. Initiation of vasopressors and sedation affect scoring.",
      details: [
        { label: "Respiratory", value: `${Number(values.resp) || 0}/4` },
        { label: "Coagulation", value: `${Number(values.coag) || 0}/4` },
        { label: "Liver", value: `${Number(values.liver) || 0}/4` },
        { label: "Cardiovascular", value: `${Number(values.cv) || 0}/4` },
        { label: "CNS", value: `${Number(values.cns) || 0}/4` },
        { label: "Renal", value: `${Number(values.renal) || 0}/4` },
      ],
    };
  },
};
