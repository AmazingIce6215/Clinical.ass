import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const map: CalculatorDefinition = {
  slug: "mean-arterial-pressure",
  title: "Mean Arterial Pressure (MAP)",
  shortName: "MAP",
  description: "Estimates mean arterial pressure from systolic and diastolic blood pressure.",
  category: "critical-care",
  icon: "heart-pulse",
  clinicalApplication:
    "Supports perfusion-pressure context in shock, sepsis, and critical-care teaching. Interpret with clinical perfusion signs.",
  evidence: {
    version: "Standard MAP = DBP + 1/3 (SBP − DBP)",
    intendedPopulation: "Adults with non-invasive or invasive blood pressure measurements.",
    exclusions: [
      "Non-pulsatile flow (e.g. some ECMO configurations) where MAP definition differs",
      "Highly irregular rhythms where single-pair SBP/DBP poorly represent mean pressure",
    ],
    references: [
      {
        title: "Surviving Sepsis Campaign guidelines",
        citation: "Evans L, et al. Crit Care Med. 2021;49(11):e1063–e1143.",
        url: "https://pubmed.ncbi.nlm.nih.gov/34605781/",
      },
      {
        title: "Blood pressure measurement concepts",
        citation: "Sesso HD, et al. Hypertension. 2000;36(5):801–807.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11082146/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "sbp", label: "Systolic BP", type: "number", suffix: "mmHg", min: 40, max: 300, step: 1 },
    { id: "dbp", label: "Diastolic BP", type: "number", suffix: "mmHg", min: 20, max: 200, step: 1 },
  ],
  calculate: (values) => {
    const sbp = asNumber(values.sbp);
    const dbp = asNumber(values.dbp);
    if (sbp < dbp) throw new Error("Systolic BP must be greater than or equal to diastolic BP.");
    const mapValue = dbp + (sbp - dbp) / 3;

    let severity: "low" | "moderate" | "high" = "low";
    let label = "MAP in a commonly targeted range for many shock pathways";
    if (mapValue < 65) {
      severity = "high";
      label = "MAP below common sepsis perfusion target band";
    } else if (mapValue >= 100) {
      severity = "moderate";
      label = "Elevated MAP relative to usual resting values";
    }

    return formulaResult({
      value: mapValue,
      unit: "mmHg",
      digits: 0,
      label,
      severity,
      interpretation: `Estimated MAP ${roundTo(mapValue, 0)} mmHg from BP ${sbp}/${dbp} mmHg.`,
      clinicalSignificance:
        "Many sepsis pathways discuss a MAP target near 65 mmHg, but individual targets vary with chronic hypertension, trauma, and organ perfusion.",
      limitations:
        "Formula assumes a standard pulse-pressure weighting. Invasive monitoring may differ from cuff estimates.",
      details: [
        { label: "SBP", value: `${sbp} mmHg` },
        { label: "DBP", value: `${dbp} mmHg` },
        { label: "MAP", value: `${roundTo(mapValue, 0)} mmHg` },
      ],
      recommendations: [
        "Correlate with lactate, urine output, mentation, and skin perfusion.",
        "Escalate care for hypotension with end-organ dysfunction per local pathway.",
      ],
    });
  },
};
