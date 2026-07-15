import type { CalculatorDefinition } from "../types";
import { asBoolean, asNumber, scoreResult } from "../helpers";

export const pesi: CalculatorDefinition = {
  slug: "pesi",
  title: "Pulmonary Embolism Severity Index (PESI)",
  shortName: "PESI",
  description:
    "Estimates 30-day mortality risk classes in patients with acute pulmonary embolism.",
  category: "pulmonology",
  icon: "air-vent",
  clinicalApplication:
    "Supports severity discussion after PE is diagnosed. Does not diagnose PE.",
  evidence: {
    version: "Original PESI 11-variable score",
    intendedPopulation: "Adults with objectively confirmed acute PE.",
    exclusions: [
      "Suspected but unconfirmed PE",
      "Use without integrating RV strain, biomarkers, and clinical instability",
    ],
    references: [
      {
        title: "Derivation and validation of a prognostic model for pulmonary embolism",
        citation: "Aujesky D, et al. Am J Respir Crit Care Med. 2005;172(8):1041–1046.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16020800/",
      },
      {
        title: "Outpatient treatment of PE using PESI",
        citation: "Aujesky D, et al. Lancet. 2011;378(9785):41–48.",
        url: "https://pubmed.ncbi.nlm.nih.gov/21703676/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age", label: "Age", type: "number", suffix: "years", min: 18, max: 120, step: 1 },
    { id: "male", label: "Male sex", type: "boolean" },
    { id: "cancer", label: "History of cancer", type: "boolean" },
    { id: "hf", label: "Heart failure", type: "boolean" },
    { id: "clung", label: "Chronic lung disease", type: "boolean" },
    { id: "hr", label: "Pulse ≥ 110/min", type: "boolean" },
    { id: "sbp", label: "SBP < 100 mmHg", type: "boolean" },
    { id: "rr", label: "Respiratory rate ≥ 30/min", type: "boolean" },
    { id: "temp", label: "Temperature < 36°C", type: "boolean" },
    { id: "ams", label: "Altered mental status", type: "boolean" },
    { id: "o2", label: "Arterial O₂ saturation < 90%", type: "boolean" },
  ],
  calculate: (values) => {
    const age = asNumber(values.age);
    let score = age;
    if (asBoolean(values.male)) score += 10;
    if (asBoolean(values.cancer)) score += 30;
    if (asBoolean(values.hf)) score += 10;
    if (asBoolean(values.clung)) score += 10;
    if (asBoolean(values.hr)) score += 20;
    if (asBoolean(values.sbp)) score += 30;
    if (asBoolean(values.rr)) score += 20;
    if (asBoolean(values.temp)) score += 20;
    if (asBoolean(values.ams)) score += 60;
    if (asBoolean(values.o2)) score += 20;

    let classLabel = "Class I — very low risk band";
    let severity: "low" | "moderate" | "high" | "severe" | "critical" = "low";
    if (score > 125) {
      classLabel = "Class V — very high risk band";
      severity = "critical";
    } else if (score > 105) {
      classLabel = "Class IV — high risk band";
      severity = "severe";
    } else if (score > 85) {
      classLabel = "Class III — moderate risk band";
      severity = "high";
    } else if (score > 65) {
      classLabel = "Class II — low risk band";
      severity = "moderate";
    }

    return scoreResult({
      score,
      maxScore: 300,
      label: classLabel,
      severity,
      interpretation: `PESI score ${score} — ${classLabel}.`,
      clinicalSignificance:
        "Lower classes have been studied for outpatient PE pathways in selected patients; higher classes warrant closer monitoring.",
      limitations:
        "Does not capture all markers of RV strain. Local outpatient PE criteria may be stricter than class I–II alone.",
      recommendations:
        severity === "low" || severity === "moderate"
          ? [
              "Review eligibility for outpatient management only if hemodynamically stable and social support is adequate.",
              "Ensure anticoagulation plan and safety-net advice.",
            ]
          : [
              "Inpatient monitoring is commonly required.",
              "Assess for high-risk PE features and consider senior/respiratory review.",
            ],
    });
  },
};
