import type { CalculatorDefinition, CalculatorResult } from "../types";

export const childPugh: CalculatorDefinition = {
  slug: "child-pugh",
  title: "Child-Pugh Score",
  shortName: "Child-Pugh",
  description:
    "Assesses severity of liver disease and predicts prognosis in cirrhosis. Used for transplant prioritisation.",
  category: "hepatology",
  icon: "stethoscope",
  clinicalApplication:
    "Supports broad classification of hepatic functional severity in cirrhosis and contextual discussion of prognosis and procedural risk.",
  evidence: {
    version: "Standard five-domain Child-Pugh score",
    intendedPopulation:
      "Adults with chronic liver disease or cirrhosis being assessed for hepatic functional severity and prognosis.",
    exclusions: [
      "Acute liver failure",
      "Children and young people under 18 years",
      "Use for transplant allocation where MELD-based systems are required",
      "Interpretation without considering the subjectivity of ascites and encephalopathy grading",
    ],
    references: [
      {
        title: "Transection of the oesophagus for bleeding oesophageal varices",
        citation: "Pugh RNH, et al. Br J Surg. 1973;60(8):646–649.",
        url: "https://pubmed.ncbi.nlm.nih.gov/4541913/",
      },
      {
        title: "EASL Clinical Practice Guidelines for the management of patients with decompensated cirrhosis",
        citation: "European Association for the Study of the Liver. J Hepatol. 2018;69(2):406–460.",
        url: "https://pubmed.ncbi.nlm.nih.gov/29653741/",
      },
    ],
    reviewedAt: "2026-07-14",
  },
  inputs: [
    {
      id: "bilirubin",
      label: "Bilirubin (µmol/L)",
      type: "select",
      options: [
        { label: "< 34 (≤ 2 mg/dL) — 1 pt", value: "1", points: 1 },
        { label: "34–51 (2–3 mg/dL) — 2 pts", value: "2", points: 2 },
        { label: "> 51 (> 3 mg/dL) — 3 pts", value: "3", points: 3 },
      ],
    },
    {
      id: "albumin",
      label: "Albumin (g/L)",
      type: "select",
      options: [
        { label: "> 35 (> 3.5 g/dL) — 1 pt", value: "1", points: 1 },
        { label: "28–35 (2.8–3.5 g/dL) — 2 pts", value: "2", points: 2 },
        { label: "< 28 (< 2.8 g/dL) — 3 pts", value: "3", points: 3 },
      ],
    },
    {
      id: "inr",
      label: "INR",
      type: "select",
      options: [
        { label: "< 1.7 — 1 pt", value: "1", points: 1 },
        { label: "1.7–2.3 — 2 pts", value: "2", points: 2 },
        { label: "> 2.3 — 3 pts", value: "3", points: 3 },
      ],
    },
    {
      id: "ascites",
      label: "Ascites",
      type: "select",
      options: [
        { label: "None — 1 pt", value: "1", points: 1 },
        { label: "Mild / medically controlled — 2 pts", value: "2", points: 2 },
        { label: "Moderate–severe / refractory — 3 pts", value: "3", points: 3 },
      ],
    },
    {
      id: "encephalopathy",
      label: "Hepatic Encephalopathy",
      type: "select",
      options: [
        { label: "None — 1 pt", value: "1", points: 1 },
        { label: "Grade I–II (mild–moderate) — 2 pts", value: "2", points: 2 },
        { label: "Grade III–IV (severe–coma) — 3 pts", value: "3", points: 3 },
      ],
    },
  ],
  calculate: (values) => {
    const score = (Number(values.bilirubin) || 1) + (Number(values.albumin) || 1)
      + (Number(values.inr) || 1) + (Number(values.ascites) || 1)
      + (Number(values.encephalopathy) || 1);

    let severity: CalculatorResult["severity"] = "low";
    let label = "Child-Pugh Class A (compensated)";
    if (score >= 10) { severity = "severe"; label = "Child-Pugh Class C (decompensated)"; }
    else if (score >= 7) { severity = "moderate"; label = "Child-Pugh Class B (significant impairment)"; }

    return {
      score,
      maxScore: 15,
      severity,
      label,
      interpretation: `Child-Pugh score ${score}/15 — ${label}.`,
      clinicalSignificance:
        "Class A (5–6): well-compensated; surgical risk low. Class B (7–9): significant functional impairment; consider pre-op optimisation. Class C (10–15): decompensated; avoid elective surgery. Assess MELD-Na for transplant listing.",
      recommendations:
        score <= 6
          ? ["Interpret the class alongside portal-hypertension features, comorbidity, and the planned procedure.", "Review variceal and hepatocellular-carcinoma surveillance under the current cirrhosis guideline.", "Plan laboratory and clinical follow-up according to disease stability and specialist advice."]
          : score <= 9
            ? ["Seek specialist assessment and optimisation before an elective procedure.", "Review for current or previous decompensation, including ascites, encephalopathy, jaundice, and variceal bleeding.", "Consider MELD-based assessment and hepatology referral when clinically appropriate."]
            : ["Elective procedures generally require careful multidisciplinary risk review because decompensation risk is high.", "Prompt hepatology input and transplant eligibility assessment may be appropriate.", "Manage cirrhosis complications using current specialist and local guidance."],
      limitations:
        "Subjective assessment of ascites and encephalopathy. Does not account for portal hypertension complications (variceal bleeding, SBP). MELD/MELD-Na preferred for transplant allocation.",
      details: [
        { label: "Bilirubin", value: `${Number(values.bilirubin) || 1}/3` },
        { label: "Albumin", value: `${Number(values.albumin) || 1}/3` },
        { label: "INR", value: `${Number(values.inr) || 1}/3` },
        { label: "Ascites", value: `${Number(values.ascites) || 1}/3` },
        { label: "Encephalopathy", value: `${Number(values.encephalopathy) || 1}/3` },
      ],
    };
  },
};
