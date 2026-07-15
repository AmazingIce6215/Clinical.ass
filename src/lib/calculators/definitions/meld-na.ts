import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const meldNa: CalculatorDefinition = {
  slug: "meld-na",
  title: "MELD-Na Score",
  shortName: "MELD-Na",
  description:
    "Model for End-Stage Liver Disease with sodium, used for prognosis and transplant priority discussions.",
  category: "hepatology",
  icon: "stethoscope",
  clinicalApplication:
    "Educational prognostic estimate in cirrhosis. Official listing scores use certified lab pathways.",
  evidence: {
    version: "MELD-Na (UNOS/OPTN style educational calculation)",
    intendedPopulation: "Adults with chronic liver disease for prognosis teaching.",
    exclusions: [
      "Acute liver failure listing pathways",
      "Children (use PELD)",
      "Use as sole transplant listing without centre protocols",
    ],
    references: [
      {
        title: "A model to predict survival in patients with end-stage liver disease",
        citation: "Kamath PS, et al. Hepatology. 2001;33(2):464–470.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11172350/",
      },
      {
        title: "Hyponatremia and mortality among patients on the liver-transplant waiting list",
        citation: "Kim WR, et al. N Engl J Med. 2008;359(10):1018–1026.",
        url: "https://pubmed.ncbi.nlm.nih.gov/18768945/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "bilirubin",
      label: "Bilirubin",
      type: "number",
      suffix: "mg/dL",
      min: 0.1,
      max: 50,
      step: 0.1,
      helpText: "mg/dL (µmol/L ÷ 17.1).",
    },
    {
      id: "inr",
      label: "INR",
      type: "number",
      min: 0.5,
      max: 20,
      step: 0.01,
    },
    {
      id: "creatinine",
      label: "Creatinine",
      type: "number",
      suffix: "mg/dL",
      min: 0.1,
      max: 20,
      step: 0.01,
      helpText: "mg/dL (µmol/L ÷ 88.4). Cap applied at 4.0; dialysis sets to 4.0.",
    },
    { id: "dialysis", label: "Dialysis ≥2× in past week", type: "boolean" },
    {
      id: "sodium",
      label: "Sodium",
      type: "number",
      suffix: "mmol/L",
      min: 100,
      max: 160,
      step: 0.1,
    },
  ],
  calculate: (values) => {
    const bilirubin = Math.max(asNumber(values.bilirubin), 1);
    const inr = Math.max(asNumber(values.inr), 1);
    let creat = asNumber(values.creatinine);
    if (values.dialysis) creat = 4;
    creat = Math.min(Math.max(creat, 1), 4);
    let sodium = asNumber(values.sodium);
    sodium = Math.min(Math.max(sodium, 125), 137);

    const meld =
      0.957 * Math.log(creat) +
      0.378 * Math.log(bilirubin) +
      1.12 * Math.log(inr) +
      0.643;
    let meldRounded = Math.round(meld * 10);
    meldRounded = Math.max(meldRounded, 6);
    const meldNaValue = meldRounded + 1.32 * (137 - sodium) - 0.033 * meldRounded * (137 - sodium);
    const score = Math.min(Math.max(Math.round(meldNaValue), 6), 40);

    let severity: "low" | "moderate" | "high" | "severe" | "critical" = "low";
    let label = "Lower MELD-Na band";
    if (score >= 30) {
      severity = "critical";
      label = "Very high MELD-Na band";
    } else if (score >= 20) {
      severity = "severe";
      label = "High MELD-Na band";
    } else if (score >= 15) {
      severity = "high";
      label = "Intermediate–high MELD-Na band";
    } else if (score >= 10) {
      severity = "moderate";
      label = "Intermediate MELD-Na band";
    }

    return formulaResult({
      value: score,
      unit: "points",
      digits: 0,
      maxScore: 40,
      label,
      severity,
      interpretation: `MELD-Na ≈ ${score} (educational calculation).`,
      clinicalSignificance:
        "Higher scores associate with higher wait-list mortality; transplant centres use certified processes.",
      limitations:
        "Lab units and dialysis definitions matter. This is educational and may differ slightly from official UNOS calculators.",
      details: [
        { label: "Bilirubin (floored)", value: `${roundTo(bilirubin, 2)} mg/dL` },
        { label: "INR (floored)", value: `${roundTo(inr, 2)}` },
        { label: "Creatinine (capped)", value: `${roundTo(creat, 2)} mg/dL` },
        { label: "Sodium (bounded)", value: `${roundTo(sodium, 1)}` },
        { label: "MELD-Na", value: `${score}` },
      ],
      recommendations: [
        "Discuss prognosis and transplant referral thresholds with hepatology.",
        "Treat reversible contributors (infection, bleeding, AKI) aggressively.",
      ],
    });
  },
};
