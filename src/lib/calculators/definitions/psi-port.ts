import type { CalculatorDefinition } from "../types";
import { asBoolean, asNumber, scoreResult } from "../helpers";

export const psiPort: CalculatorDefinition = {
  slug: "psi-port",
  title: "Pneumonia Severity Index (PORT)",
  shortName: "PSI/PORT",
  description:
    "Stratifies community-acquired pneumonia severity and supports site-of-care discussion.",
  category: "pulmonology",
  icon: "air-vent",
  clinicalApplication:
    "Educational severity tool for CAP. Integrate oxygenation, social factors, and local pathways with CURB-65.",
  evidence: {
    version: "Fine PSI/PORT classes I–V",
    intendedPopulation: "Adults with community-acquired pneumonia.",
    exclusions: [
      "Hospital-acquired pneumonia",
      "Immunocompromised hosts needing separate pathways",
      "Children",
    ],
    references: [
      {
        title: "A prediction rule to identify low-risk patients with community-acquired pneumonia",
        citation: "Fine MJ, et al. N Engl J Med. 1997;336(4):243–250.",
        url: "https://pubmed.ncbi.nlm.nih.gov/8995086/",
      },
      {
        title: "IDSA/ATS CAP guidelines risk stratification context",
        citation: "Metlay JP, et al. Am J Respir Crit Care Med. 2019;200(7):e45–e67.",
        url: "https://pubmed.ncbi.nlm.nih.gov/31573350/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age", label: "Age", type: "number", suffix: "years", min: 18, max: 120, step: 1 },
    { id: "female", label: "Female sex (−10 from age points)", type: "boolean" },
    { id: "nursing_home", label: "Nursing home resident (10)", type: "boolean" },
    { id: "neoplastic", label: "Neoplastic disease (30)", type: "boolean" },
    { id: "liver", label: "Liver disease (20)", type: "boolean" },
    { id: "chf", label: "Congestive heart failure (10)", type: "boolean" },
    { id: "cerebrovascular", label: "Cerebrovascular disease (10)", type: "boolean" },
    { id: "renal", label: "Renal disease (10)", type: "boolean" },
    { id: "ams", label: "Altered mental status (20)", type: "boolean" },
    { id: "rr", label: "Respiratory rate ≥ 30/min (20)", type: "boolean" },
    { id: "sbp", label: "SBP < 90 mmHg (20)", type: "boolean" },
    { id: "temp", label: "Temperature < 35°C or ≥ 40°C (15)", type: "boolean" },
    { id: "pulse", label: "Pulse ≥ 125/min (10)", type: "boolean" },
    { id: "ph", label: "Arterial pH < 7.35 (30)", type: "boolean" },
    { id: "bun", label: "BUN ≥ 11 mmol/L (30)", type: "boolean" },
    { id: "sodium", label: "Sodium < 130 mmol/L (20)", type: "boolean" },
    { id: "glucose", label: "Glucose ≥ 14 mmol/L (10)", type: "boolean" },
    { id: "hct", label: "Hematocrit < 30% (10)", type: "boolean" },
    { id: "pao2", label: "PaO₂ < 60 mmHg or SpO₂ < 90% (10)", type: "boolean" },
    { id: "pleural", label: "Pleural effusion (10)", type: "boolean" },
  ],
  calculate: (values) => {
    let score = asNumber(values.age);
    if (asBoolean(values.female)) score -= 10;
    if (asBoolean(values.nursing_home)) score += 10;
    if (asBoolean(values.neoplastic)) score += 30;
    if (asBoolean(values.liver)) score += 20;
    if (asBoolean(values.chf)) score += 10;
    if (asBoolean(values.cerebrovascular)) score += 10;
    if (asBoolean(values.renal)) score += 10;
    if (asBoolean(values.ams)) score += 20;
    if (asBoolean(values.rr)) score += 20;
    if (asBoolean(values.sbp)) score += 20;
    if (asBoolean(values.temp)) score += 15;
    if (asBoolean(values.pulse)) score += 10;
    if (asBoolean(values.ph)) score += 30;
    if (asBoolean(values.bun)) score += 30;
    if (asBoolean(values.sodium)) score += 20;
    if (asBoolean(values.glucose)) score += 10;
    if (asBoolean(values.hct)) score += 10;
    if (asBoolean(values.pao2)) score += 10;
    if (asBoolean(values.pleural)) score += 10;

    let classLabel = "Class II";
    let severity: "low" | "moderate" | "high" | "severe" | "critical" = "low";
    if (score > 130) {
      classLabel = "Class V";
      severity = "critical";
    } else if (score > 90) {
      classLabel = "Class IV";
      severity = "severe";
    } else if (score > 70) {
      classLabel = "Class III";
      severity = "high";
    } else if (score > 50) {
      classLabel = "Class II";
      severity = "moderate";
    } else {
      classLabel = "Class I–II low-risk band";
      severity = "low";
    }

    return scoreResult({
      score,
      maxScore: 250,
      label: `${classLabel} (PSI points ${score})`,
      severity,
      interpretation: `PSI/PORT score ${score} — ${classLabel}.`,
      clinicalSignificance:
        "Higher classes associate with higher mortality; classes I–II often considered for outpatient care when social and oxygenation factors allow.",
      limitations:
        "Underweights hypoxia and social circumstances. Class I assignment historically required absence of many predictors—use clinical judgment.",
      recommendations:
        severity === "low" || severity === "moderate"
          ? [
              "Review outpatient suitability including oxygenation and support at home.",
              "Provide clear safety-net advice and follow-up.",
            ]
          : [
              "Hospital care is commonly required; assess need for critical-care support.",
              "Use local severe CAP and antimicrobial guidelines.",
            ],
    });
  },
};
