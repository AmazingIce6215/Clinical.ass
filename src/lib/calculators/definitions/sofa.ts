import type { CalculatorDefinition, CalculatorResult } from "../types";

export const sofa: CalculatorDefinition = {
  slug: "sofa",
  title: "SOFA Score",
  shortName: "SOFA",
  description:
    "Sequential Organ Failure Assessment quantifies organ dysfunction in critically ill patients and predicts mortality.",
  category: "critical-care",
  icon: "shield-alert",
  clinicalApplication:
    "Supports serial description of organ dysfunction in critically ill adults. Trends and change from baseline should be interpreted with the complete clinical picture.",
  evidence: {
    version: "Original six-domain SOFA score",
    intendedPopulation:
      "Critically ill adults whose organ dysfunction can be assessed serially, including adults with suspected infection.",
    exclusions: [
      "Children, for whom an age-appropriate paediatric score should be used",
      "Use as a stand-alone diagnostic test for sepsis",
      "Interpretation without accounting for known pre-existing organ dysfunction",
      "Incomplete assessment when required laboratory or treatment data are unavailable",
    ],
    references: [
      {
        title: "The SOFA score to describe organ dysfunction/failure",
        citation: "Vincent JL, et al. Intensive Care Med. 1996;22(7):707–710.",
        url: "https://pubmed.ncbi.nlm.nih.gov/8844239/",
      },
      {
        title: "The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3)",
        citation: "Singer M, et al. JAMA. 2016;315(8):801–810.",
        url: "https://pubmed.ncbi.nlm.nih.gov/26903338/",
      },
    ],
    reviewedAt: "2026-07-14",
  },
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
    if (score >= 15) { severity = "critical"; label = "Extensive organ dysfunction"; }
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
        "In a patient with suspected infection, an acute increase of 2 or more points represents organ dysfunction in the Sepsis-3 framework; it is not a stand-alone diagnosis of sepsis. Trends and change from baseline are more informative than a single value.",
      recommendations:
        score < 2
          ? ["Continue clinical monitoring appropriate to the underlying condition.", "Use serial SOFA values only as one part of sepsis and organ-dysfunction assessment.", "Interpret change from baseline alongside treatment, comorbidity, and the full clinical trajectory."]
          : score <= 5
            ? ["Consider a higher level of monitoring based on the affected organ systems and trajectory.", "Review for infection and other reversible causes using the applicable acute-care pathway.", "Repeat assessment at a clinically appropriate interval to understand direction of change."]
            : score <= 9
              ? ["Critical-care review and organ support may be required according to the complete presentation.", "Trend organ function to support, not replace, assessment of response and prognosis.", "Discuss trajectory and treatment priorities with the multidisciplinary critical-care team."]
              : ["Seek senior multidisciplinary review because extensive organ dysfunction is associated with a poor prognosis.", "Ensure goals of care and the patient's preferences are understood and documented where appropriate.", "Review the proportionality and eligibility of organ-support options with the responsible critical-care team."],
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
