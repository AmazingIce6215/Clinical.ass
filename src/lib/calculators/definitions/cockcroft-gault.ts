import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const cockcroftGault: CalculatorDefinition = {
  slug: "cockcroft-gault",
  title: "Creatinine Clearance (Cockcroft–Gault)",
  shortName: "CrCl CG",
  description:
    "Estimates creatinine clearance for drug-dosing discussions using the Cockcroft–Gault equation.",
  category: "nephrology",
  icon: "kidney",
  clinicalApplication:
    "Educational dosing clearance estimate. Many modern guidelines use eGFR equations instead—follow the drug label.",
  evidence: {
    version: "Cockcroft–Gault 1976; creatinine in µmol/L converted to mg/dL",
    intendedPopulation: "Adults for whom CrCl-based dosing is specified.",
    exclusions: [
      "Unstable AKI with rapidly changing creatinine",
      "Severe obesity without adjusted-weight protocols",
      "Children and pregnancy without specialised equations",
    ],
    references: [
      {
        title: "Prediction of creatinine clearance from serum creatinine",
        citation: "Cockcroft DW, Gault MH. Nephron. 1976;16(1):31–41.",
        url: "https://pubmed.ncbi.nlm.nih.gov/1244564/",
      },
      {
        title: "Drug dosing in renal impairment",
        citation: "FDA / product labelling conventions for CrCl-based dosing.",
        url: "https://www.fda.gov/drugs",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age", label: "Age", type: "number", suffix: "years", min: 18, max: 120, step: 1 },
    {
      id: "sex",
      label: "Sex",
      type: "select",
      options: [
        { label: "Male", value: "male", points: 0 },
        { label: "Female", value: "female", points: 0 },
      ],
    },
    { id: "weight", label: "Weight", type: "number", suffix: "kg", min: 30, max: 250, step: 0.1 },
    {
      id: "creatinine",
      label: "Serum creatinine",
      type: "number",
      suffix: "µmol/L",
      min: 20,
      max: 2000,
      step: 0.1,
      helpText: "µmol/L (mg/dL × 88.4).",
    },
  ],
  calculate: (values) => {
    const age = asNumber(values.age);
    const weight = asNumber(values.weight);
    const creatUmol = asNumber(values.creatinine);
    const creatMgDl = creatUmol / 88.4;
    if (creatMgDl <= 0) throw new Error("Creatinine must be greater than zero.");
    let crcl = ((140 - age) * weight) / (72 * creatMgDl);
    if (values.sex === "female") crcl *= 0.85;

    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Estimated CrCl ≥ 60 mL/min band";
    if (crcl < 15) {
      severity = "severe";
      label = "Estimated CrCl < 15 mL/min band";
    } else if (crcl < 30) {
      severity = "high";
      label = "Estimated CrCl 15–29 mL/min band";
    } else if (crcl < 60) {
      severity = "moderate";
      label = "Estimated CrCl 30–59 mL/min band";
    }

    return formulaResult({
      value: crcl,
      unit: "mL/min",
      digits: 1,
      label,
      severity,
      interpretation: `Cockcroft–Gault CrCl ≈ ${roundTo(crcl, 1)} mL/min.`,
      clinicalSignificance:
        "Used historically for drug dosing. CKD-EPI eGFR is preferred for CKD staging in many guidelines.",
      limitations:
        "Over/underestimates at extremes of age, weight, and muscle mass. Not validated for unstable creatinine.",
      details: [
        { label: "Age", value: `${age}` },
        { label: "Sex", value: String(values.sex) },
        { label: "Weight", value: `${weight} kg` },
        { label: "Creatinine", value: `${creatUmol} µmol/L` },
        { label: "CrCl", value: `${roundTo(crcl, 1)} mL/min` },
      ],
      recommendations: [
        "Use the weight and equation specified by the drug protocol (IBW vs actual).",
        "Do not stage CKD solely with Cockcroft–Gault.",
      ],
    });
  },
};
