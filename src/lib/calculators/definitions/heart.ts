import type { CalculatorDefinition, CalculatorResult } from "../types";

export const heart: CalculatorDefinition = {
  slug: "heart-score",
  title: "HEART Score",
  shortName: "HEART",
  description:
    "Estimates the 6-week risk of major adverse cardiac events (MACE) in patients presenting with chest pain.",
  category: "cardiology",
  icon: "activity",
  clinicalApplication:
    "Supports short-term risk stratification for undifferentiated emergency chest pain. Disposition and testing should follow the full assessment and local chest-pain pathway.",
  evidence: {
    version: "Original 10-point HEART score",
    intendedPopulation:
      "Adults presenting to an emergency department with undifferentiated chest pain in whom acute coronary syndrome is being considered.",
    exclusions: [
      "ST-elevation myocardial infarction or another established diagnosis requiring immediate treatment",
      "Children and young people under 18 years",
      "Pregnancy, where validation is limited",
      "Use without the local troponin assay's reference limit and clinical pathway",
    ],
    references: [
      {
        title: "Chest pain in the emergency room: value of the HEART score",
        citation: "Six AJ, Backus BE, Kelder JC. Neth Heart J. 2008;16(6):191–196.",
        url: "https://pubmed.ncbi.nlm.nih.gov/18665203/",
      },
      {
        title: "A prospective validation of the HEART score for chest pain patients at the emergency department",
        citation: "Backus BE, et al. Int J Cardiol. 2013;168(3):2153–2158.",
        url: "https://pubmed.ncbi.nlm.nih.gov/23465250/",
      },
    ],
    reviewedAt: "2026-07-14",
  },
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
    let label = "Lower-risk score band";
    if (score >= 7) { severity = "high"; label = "Higher-risk score band"; }
    else if (score >= 4) { severity = "moderate"; label = "Intermediate-risk score band"; }

    return {
      score,
      maxScore: 10,
      severity,
      label,
      interpretation: `HEART score ${score}/10 — ${label}.`,
      clinicalSignificance:
        "Original validation studies grouped scores as 0–3, 4–6, and 7–10 with increasing short-term MACE rates. Absolute risk varies by population, troponin assay, endpoint definition, and pathway; the score does not determine disposition on its own.",
      recommendations:
        score <= 3
          ? ["Review eligibility for an accelerated chest-pain pathway using serial troponin results and the complete assessment.", "Discuss follow-up and residual uncertainty without presenting the score as a guarantee.", "Provide clear safety-net advice for recurrent or worsening symptoms."]
          : score <= 6
            ? ["Consider observation and serial troponin testing under the local chest-pain pathway.", "Repeat ECG assessment when clinically indicated and review for dynamic change.", "Review the need for non-invasive cardiac testing with the responsible team."]
            : ["Prompt senior cardiology assessment and monitored care are commonly warranted.", "Review antithrombotic therapy, contraindications, and monitoring under the applicable acute-coronary-syndrome guideline.", "Consider early discussion with an interventional cardiology service based on the full presentation."],
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
