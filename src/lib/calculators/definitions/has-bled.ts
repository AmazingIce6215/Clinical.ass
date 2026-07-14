import type { CalculatorDefinition, CalculatorResult } from "../types";

export const hasBled: CalculatorDefinition = {
  slug: "has-bled",
  title: "HAS-BLED Score",
  shortName: "HAS-BLED",
  description:
    "Estimates 1-year major bleeding risk in patients with atrial fibrillation on anticoagulation.",
  category: "cardiology",
  icon: "droplets",
  clinicalApplication:
    "Supports identification of bleeding risk factors in atrial fibrillation, particularly modifiable factors that warrant review and closer follow-up.",
  evidence: {
    version: "HAS-BLED nine-point score",
    intendedPopulation:
      "Adults with atrial fibrillation who are receiving or being considered for oral anticoagulation.",
    exclusions: [
      "Patients without atrial fibrillation",
      "Children and young people under 18 years",
      "Use of the score alone to withhold indicated anticoagulation",
      "Use without reviewing and addressing modifiable bleeding risk factors",
    ],
    references: [
      {
        title: "A novel user-friendly score to assess one-year risk of major bleeding in atrial fibrillation",
        citation: "Pisters R, et al. Chest. 2010;138(5):1093–1100.",
        url: "https://pubmed.ncbi.nlm.nih.gov/20299623/",
      },
      {
        title: "ESC Clinical Practice Guidelines for the management of atrial fibrillation",
        citation: "European Society of Cardiology. 2024 ESC guideline.",
        url: "https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/atrial-fibrillation/",
      },
    ],
    reviewedAt: "2026-07-14",
  },
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
        "Scores of 3 or more identify a group with increased bleeding risk and should prompt review of modifiable factors and follow-up intensity. A high score alone should not be used to withhold indicated anticoagulation.",
      recommendations:
        score < 3
          ? ["Interpret bleeding risk alongside thromboembolic benefit; the score does not establish that anticoagulation is safe for an individual.", "Review blood pressure, renal and hepatic function, and other changing risk factors during follow-up.", "Check for modifiable medication risks, including NSAIDs and concurrent antiplatelet therapy."]
          : ["Prioritise review of modifiable factors such as uncontrolled hypertension, NSAID use, alcohol excess, and labile INR.", "For warfarin therapy, review time in therapeutic range and alternative options under current guidance.", "Do not use a high HAS-BLED score alone as a contraindication to anticoagulation; assess net clinical benefit.", "Consider closer follow-up based on the treatment plan and individual risk factors."],
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
