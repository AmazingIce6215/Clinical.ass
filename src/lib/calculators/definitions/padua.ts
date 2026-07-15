import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const padua: CalculatorDefinition = {
  slug: "padua",
  title: "Padua Prediction Score (VTE Risk)",
  shortName: "Padua",
  description:
    "Estimates VTE risk in hospitalised medical patients to guide prophylaxis decisions.",
  category: "hematology",
  icon: "droplets",
  clinicalApplication:
    "Medical-ward VTE risk teaching. Follow local prophylaxis protocols and bleeding risk assessment.",
  evidence: {
    version: "Padua prediction score",
    intendedPopulation: "Acutely ill hospitalised medical patients.",
    exclusions: [
      "Surgical patients (use Caprini/other tools)",
      "Already therapeutic anticoagulation",
    ],
    references: [
      {
        title: "A risk assessment model for the identification of hospitalized medical patients at risk for venous thromboembolism",
        citation: "Barbar S, et al. J Thromb Haemost. 2010;8(11):2450–2457.",
        url: "https://pubmed.ncbi.nlm.nih.gov/20738765/",
      },
      {
        title: "ASH VTE prophylaxis guidelines context",
        citation: "Schünemann HJ, et al. Blood Adv. 2018.",
        url: "https://pubmed.ncbi.nlm.nih.gov/30482763/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "cancer", label: "Active cancer (3)", type: "boolean" },
    { id: "prior_vte", label: "Previous VTE (excluding superficial) (3)", type: "boolean" },
    { id: "reduced_mobility", label: "Reduced mobility (3)", type: "boolean" },
    { id: "thrombophilia", label: "Known thrombophilic condition (3)", type: "boolean" },
    { id: "trauma_surgery", label: "Recent trauma and/or surgery ≤1 month (2)", type: "boolean" },
    { id: "age_70", label: "Age ≥ 70 years (1)", type: "boolean" },
    { id: "heart_resp", label: "Heart and/or respiratory failure (1)", type: "boolean" },
    { id: "mi_stroke", label: "Acute MI and/or ischaemic stroke (1)", type: "boolean" },
    { id: "infection_rheum", label: "Acute infection and/or rheumatologic disorder (1)", type: "boolean" },
    { id: "obesity", label: "Obesity BMI ≥ 30 (1)", type: "boolean" },
    { id: "hormone", label: "Ongoing hormonal treatment (1)", type: "boolean" },
  ],
  calculate: (values) => {
    const score =
      (values.cancer ? 3 : 0) +
      (values.prior_vte ? 3 : 0) +
      (values.reduced_mobility ? 3 : 0) +
      (values.thrombophilia ? 3 : 0) +
      (values.trauma_surgery ? 2 : 0) +
      (values.age_70 ? 1 : 0) +
      (values.heart_resp ? 1 : 0) +
      (values.mi_stroke ? 1 : 0) +
      (values.infection_rheum ? 1 : 0) +
      (values.obesity ? 1 : 0) +
      (values.hormone ? 1 : 0);
    const high = score >= 4;
    return scoreResult({
      score,
      maxScore: 20,
      label: high ? "High VTE risk (≥4) — prophylaxis often indicated" : "Low VTE risk (<4)",
      severity: high ? "high" : "low",
      interpretation: `Padua score ${score}.`,
      clinicalSignificance:
        "Scores ≥4 identify medical inpatients at higher VTE risk who typically warrant pharmacologic prophylaxis if bleeding risk allows.",
      limitations:
        "Does not quantify bleeding risk. Local protocols may use different tools.",
      recommendations: high
        ? [
            "Offer pharmacologic prophylaxis unless contraindicated; consider mechanical methods if bleeding risk high.",
            "Early mobilisation and education about VTE symptoms.",
          ]
        : [
            "Pharmacologic prophylaxis may not be required solely based on Padua.",
            "Reassess if clinical status changes.",
          ],
    });
  },
};
