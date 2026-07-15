import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const timiNstemi: CalculatorDefinition = {
  slug: "timi-nstemi",
  title: "TIMI Risk Score (NSTEMI/UA)",
  shortName: "TIMI NSTE",
  description:
    "Seven-item score estimating risk of adverse cardiac events in unstable angina / NSTEMI.",
  category: "cardiology",
  icon: "activity",
  clinicalApplication:
    "Supports short-term risk discussion in NSTE-ACS. Local pathways may prefer GRACE.",
  evidence: {
    version: "TIMI UA/NSTEMI seven-point score",
    intendedPopulation: "Adults with unstable angina or NSTEMI in acute-care settings.",
    exclusions: [
      "STEMI (use TIMI STEMI)",
      "Chest pain clearly non-ischaemic after evaluation",
    ],
    references: [
      {
        title: "The TIMI risk score for unstable angina/non-ST elevation MI",
        citation: "Antman EM, et al. JAMA. 2000;284(7):835–842.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10938172/",
      },
      {
        title: "ESC NSTE-ACS guidelines (risk stratification context)",
        citation: "Collet JP, et al. Eur Heart J. 2021;42(14):1289–1367.",
        url: "https://pubmed.ncbi.nlm.nih.gov/34447989/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age", label: "Age ≥ 65 years", type: "boolean" },
    { id: "risk_factors", label: "≥3 CAD risk factors (FH, HTN, DM, lipids, smoking)", type: "boolean" },
    { id: "known_cad", label: "Known CAD (stenosis ≥ 50%)", type: "boolean" },
    { id: "aspirin", label: "Aspirin use in past 7 days", type: "boolean" },
    { id: "severe_angina", label: "Severe angina (≥2 episodes in 24 h)", type: "boolean" },
    { id: "st_dev", label: "ST deviation ≥ 0.5 mm", type: "boolean" },
    { id: "positive_marker", label: "Positive cardiac marker", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, [
      "age",
      "risk_factors",
      "known_cad",
      "aspirin",
      "severe_angina",
      "st_dev",
      "positive_marker",
    ]);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Lower TIMI band (0–2)";
    if (score >= 5) {
      severity = "high";
      label = "Higher TIMI band (5–7)";
    } else if (score >= 3) {
      severity = "moderate";
      label = "Intermediate TIMI band (3–4)";
    }
    return scoreResult({
      score,
      maxScore: 7,
      label,
      severity,
      interpretation: `TIMI UA/NSTEMI score ${score}/7.`,
      clinicalSignificance:
        "Higher scores associate with higher 14-day risk of death/MI/urgent revasc in original cohorts; absolute risks vary by era and therapy.",
      limitations:
        "Derived in trial populations. Does not replace ECG review, serial troponin, or cardiology pathways.",
      recommendations:
        score <= 2
          ? ["Integrate with serial troponin and local chest-pain/ACS pathway.", "Consider early discharge pathways only when full assessment allows."]
          : [
              "Inpatient ACS management and early cardiology involvement are commonly warranted.",
              "Review antithrombotic strategy and ischaemia-guided vs early invasive timing.",
            ],
    });
  },
};
