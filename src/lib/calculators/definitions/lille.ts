import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const lille: CalculatorDefinition = {
  slug: "lille-model",
  title: "Lille Model (Alcoholic Hepatitis)",
  shortName: "Lille",
  description:
    "Predicts 6-month survival and steroid response in severe alcoholic hepatitis using early change in bilirubin.",
  category: "hepatology",
  icon: "stethoscope",
  clinicalApplication:
    "Day-7 reassessment after corticosteroids in severe alcoholic hepatitis.",
  evidence: {
    version: "Lille model (Louvet)",
    intendedPopulation: "Adults with severe alcoholic hepatitis treated with corticosteroids.",
    exclusions: [
      "Not on corticosteroids / not severe AH",
      "Missing day-0 or day-7 bilirubin",
    ],
    references: [
      {
        title: "The Lille model: a new tool for therapeutic strategy in patients with severe alcoholic hepatitis treated with steroids",
        citation: "Louvet A, et al. Hepatology. 2007;45(6):1348–1354.",
        url: "https://pubmed.ncbi.nlm.nih.gov/17518367/",
      },
      {
        title: "AASLD alcoholic hepatitis guidance",
        citation: "Crabb DW, et al. Hepatology. 2020.",
        url: "https://pubmed.ncbi.nlm.nih.gov/31314133/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age", label: "Age", type: "number", suffix: "years", min: 18, max: 90, step: 1 },
    { id: "albumin", label: "Albumin day 0", type: "number", suffix: "g/L", min: 10, max: 60, step: 0.1 },
    { id: "bili0", label: "Bilirubin day 0", type: "number", suffix: "µmol/L", min: 50, max: 1000, step: 0.1 },
    { id: "bili7", label: "Bilirubin day 7", type: "number", suffix: "µmol/L", min: 10, max: 1000, step: 0.1 },
    { id: "creatinine", label: "Creatinine", type: "number", suffix: "µmol/L", min: 20, max: 1000, step: 0.1 },
    { id: "pt", label: "Prothrombin time", type: "number", suffix: "seconds", min: 10, max: 100, step: 0.1 },
  ],
  calculate: (values) => {
    const age = asNumber(values.age);
    const albumin = asNumber(values.albumin); // g/L
    const bili0 = asNumber(values.bili0);
    const bili7 = asNumber(values.bili7);
    const creat = asNumber(values.creatinine);
    const pt = asNumber(values.pt);
    const rBili = bili0 === 0 ? 0 : bili7 / bili0;
    // Lille = exp(-R)/(1+exp(-R))
    // R = 3.19 − 0.101×age + 0.147×albumin_g/L + 0.0165×(bili0_µmol) − 0.206×(renal insufficiency) − 0.0065×(bili7_µmol) − 0.0096×PT
    // renal insufficiency: creatinine >115 µmol/L (1.3 mg/dL)
    const renal = creat > 115 ? 1 : 0;
    const R =
      3.19 -
      0.101 * age +
      0.147 * albumin +
      0.0165 * bili0 -
      0.206 * renal -
      0.0065 * bili7 -
      0.0096 * pt;
    // Note: published formula uses specific units; this educational implementation follows common µmol/L + g/L form used in calculators
    const lille = Math.exp(-R) / (1 + Math.exp(-R));
    const nonResponder = lille >= 0.45;
    return formulaResult({
      value: lille,
      digits: 3,
      label: nonResponder
        ? "Lille ≥ 0.45 — non-response band"
        : "Lille < 0.45 — response band",
      severity: nonResponder ? "high" : "moderate",
      interpretation: `Lille score ${roundTo(lille, 3)} (bilirubin ratio day7/day0 ${roundTo(rBili, 2)}).`,
      clinicalSignificance:
        "Lille ≥0.45 suggests poor response to steroids and worse 6-month survival; consider stopping steroids and alternative pathways.",
      limitations:
        "Unit conventions matter. Confirm with a validated local calculator before treatment changes.",
      details: [
        { label: "Lille", value: `${roundTo(lille, 3)}` },
        { label: "Renal insufficiency", value: renal ? "Yes" : "No" },
        { label: "Bili ratio", value: `${roundTo(rBili, 2)}` },
      ],
      recommendations: nonResponder
        ? [
            "Discuss stopping corticosteroids with hepatology.",
            "Optimise nutrition, infection work-up, and transplant evaluation if appropriate.",
          ]
        : [
            "Continue protocolised therapy with close monitoring.",
            "Reassess for infection and other complications.",
          ],
    });
  },
};
