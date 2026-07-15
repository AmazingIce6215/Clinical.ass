import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const mdrdEgfr: CalculatorDefinition = {
  slug: "mdrd-egfr",
  title: "MDRD eGFR (4-variable)",
  shortName: "MDRD",
  description:
    "Estimates GFR using the 4-variable MDRD equation (historical; CKD-EPI preferred).",
  category: "nephrology",
  icon: "kidney",
  clinicalApplication:
    "Educational comparison with CKD-EPI. Many labs have transitioned away from MDRD.",
  evidence: {
    version: "IDMS-traceable 4-variable MDRD",
    intendedPopulation: "Adults with stable creatinine (historical CKD staging contexts).",
    exclusions: [
      "Age < 18",
      "AKI with unstable creatinine",
      "Preference for CKD-EPI 2021 in current practice",
    ],
    references: [
      {
        title: "A more accurate method to estimate glomerular filtration rate from serum creatinine",
        citation: "Levey AS, et al. Ann Intern Med. 1999;130(6):461–470.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10075613/",
      },
      {
        title: "Expressing the MDRD study equation for IDMS creatinine",
        citation: "Levey AS, et al. Clin Chem. 2007;53(4):766–772.",
        url: "https://pubmed.ncbi.nlm.nih.gov/17332152/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "sex",
      label: "Sex",
      type: "select",
      options: [
        { label: "Female", value: "female", points: 0 },
        { label: "Male", value: "male", points: 0 },
      ],
    },
    { id: "age", label: "Age", type: "number", suffix: "years", min: 18, max: 120, step: 1 },
    {
      id: "creatinine",
      label: "Serum creatinine",
      type: "number",
      suffix: "µmol/L",
      min: 20,
      max: 2000,
      step: 0.1,
    },
  ],
  calculate: (values) => {
    const age = asNumber(values.age);
    const scrMgDl = asNumber(values.creatinine) / 88.4;
    // 175 × Scr^-1.154 × age^-0.203 × 0.742 if female (IDMS)
    let egfr = 175 * scrMgDl ** -1.154 * age ** -0.203;
    if (values.sex === "female") egfr *= 0.742;
    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "eGFR ≥ 60 band";
    if (egfr < 15) {
      severity = "severe";
      label = "eGFR < 15 band";
    } else if (egfr < 30) {
      severity = "high";
      label = "eGFR 15–29 band";
    } else if (egfr < 60) {
      severity = "moderate";
      label = "eGFR 30–59 band";
    }
    return formulaResult({
      value: egfr,
      unit: "mL/min/1.73 m²",
      digits: 1,
      label,
      severity,
      interpretation: `MDRD eGFR ≈ ${roundTo(egfr, 1)} mL/min/1.73 m².`,
      clinicalSignificance:
        "Historical standard for eGFR reporting; CKD-EPI generally more accurate especially at higher GFR.",
      limitations:
        "Race coefficient versions exist historically and are not used here. Not for drug dosing when CrCl specified.",
      details: [
        { label: "Age", value: `${age}` },
        { label: "Sex", value: String(values.sex) },
        { label: "eGFR", value: `${roundTo(egfr, 1)}` },
      ],
      recommendations: [
        "Prefer CKD-EPI 2021 for current staging discussions.",
        "Confirm chronicity before diagnosing CKD.",
      ],
    });
  },
};
