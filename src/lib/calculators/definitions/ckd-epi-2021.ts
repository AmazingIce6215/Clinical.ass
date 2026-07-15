import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const ckdEpi2021: CalculatorDefinition = {
  slug: "ckd-epi-2021",
  title: "eGFR CKD-EPI 2021",
  shortName: "CKD-EPI",
  description:
    "Estimates GFR using the 2021 CKD-EPI creatinine equation without a race coefficient.",
  category: "nephrology",
  icon: "kidney",
  clinicalApplication:
    "Educational eGFR for CKD discussion and staging context. Confirm assay calibration and local lab reporting.",
  evidence: {
    version: "CKD-EPI creatinine equation 2021 (no race coefficient)",
    intendedPopulation: "Adults ≥18 years with stable serum creatinine.",
    exclusions: [
      "Age < 18 years (use paediatric equations)",
      "Rapidly changing creatinine (AKI)",
      "Pregnancy, extremes of muscle mass, amputation without specialist interpretation",
    ],
    references: [
      {
        title: "New creatinine- and cystatin C–based equations to estimate GFR without race",
        citation: "Inker LA, et al. N Engl J Med. 2021;385(19):1737–1749.",
        url: "https://pubmed.ncbi.nlm.nih.gov/34554658/",
      },
      {
        title: "KDIGO CKD evaluation and management",
        citation: "Kidney Disease: Improving Global Outcomes. Kidney Int Suppl. 2013.",
        url: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
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
      helpText: "IDMS-traceable creatinine in µmol/L.",
    },
  ],
  calculate: (values) => {
    const age = asNumber(values.age);
    const scrUmol = asNumber(values.creatinine);
    const scr = scrUmol / 88.4; // mg/dL
    const female = values.sex === "female";
    const kappa = female ? 0.7 : 0.9;
    const alpha = female ? -0.241 : -0.302;
    const sexFactor = female ? 1.012 : 1;
    const minRatio = Math.min(scr / kappa, 1);
    const maxRatio = Math.max(scr / kappa, 1);
    const egfr = 142 * minRatio ** alpha * maxRatio ** -1.2 * 0.9938 ** age * sexFactor;

    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "eGFR ≥ 60 band";
    if (egfr < 15) {
      severity = "severe";
      label = "eGFR < 15 band (KDIGO G5 context)";
    } else if (egfr < 30) {
      severity = "high";
      label = "eGFR 15–29 band (KDIGO G4 context)";
    } else if (egfr < 45) {
      severity = "moderate";
      label = "eGFR 30–44 band (KDIGO G3b context)";
    } else if (egfr < 60) {
      severity = "moderate";
      label = "eGFR 45–59 band (KDIGO G3a context)";
    }

    return formulaResult({
      value: egfr,
      unit: "mL/min/1.73 m²",
      digits: 1,
      label,
      severity,
      interpretation: `CKD-EPI 2021 eGFR ≈ ${roundTo(egfr, 1)} mL/min/1.73 m².`,
      clinicalSignificance:
        "eGFR is one component of CKD staging with albuminuria and clinical context. Single values need confirmation.",
      limitations:
        "Less accurate at extremes of muscle mass and in AKI. Not for drug dosing when label specifies CrCl.",
      details: [
        { label: "Sex", value: String(values.sex) },
        { label: "Age", value: `${age}` },
        { label: "Creatinine", value: `${scrUmol} µmol/L` },
        { label: "eGFR", value: `${roundTo(egfr, 1)}` },
      ],
      recommendations: [
        "Confirm chronicity before labelling CKD.",
        "Review albuminuria (ACR) for full KDIGO risk stratification.",
      ],
    });
  },
};
