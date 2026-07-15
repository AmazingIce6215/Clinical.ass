import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const atriaBleed: CalculatorDefinition = {
  slug: "atria-bleed",
  title: "ATRIA Bleeding Risk Score",
  shortName: "ATRIA Bleed",
  description:
    "Estimates major bleeding risk on warfarin in atrial fibrillation.",
  category: "cardiology",
  icon: "droplets",
  clinicalApplication:
    "Educational bleeding-risk adjunct in AF anticoagulation discussions alongside HAS-BLED.",
  evidence: {
    version: "ATRIA bleeding risk score",
    intendedPopulation: "Adults with AF considered for or taking warfarin.",
    exclusions: [
      "DOAC-specific risk models may differ",
      "Active major bleeding",
    ],
    references: [
      {
        title: "A new risk scheme to predict warfarin-associated hemorrhage",
        citation: "Fang MC, et al. J Am Coll Cardiol. 2011;58(4):395–401.",
        url: "https://pubmed.ncbi.nlm.nih.gov/21757117/",
      },
      {
        title: "ESC AF guidelines bleeding assessment context",
        citation: "Hindricks G, et al. Eur Heart J. 2021;42(5):373–498.",
        url: "https://pubmed.ncbi.nlm.nih.gov/32860505/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "anemia", label: "Anemia (3)", type: "boolean" },
    { id: "severe_renal", label: "Severe renal disease eGFR <30 or dialysis (3)", type: "boolean" },
    { id: "age_75", label: "Age ≥ 75 years (2)", type: "boolean" },
    { id: "prior_bleed", label: "Any prior haemorrhage (1)", type: "boolean" },
    { id: "htn", label: "Diagnosed hypertension (1)", type: "boolean" },
  ],
  calculate: (values) => {
    const score =
      (values.anemia ? 3 : 0) +
      (values.severe_renal ? 3 : 0) +
      (values.age_75 ? 2 : 0) +
      (values.prior_bleed ? 1 : 0) +
      (values.htn ? 1 : 0);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Low ATRIA bleeding band (0–3)";
    if (score >= 5) {
      severity = "high";
      label = "High ATRIA bleeding band (5–10)";
    } else if (score === 4) {
      severity = "moderate";
      label = "Intermediate ATRIA bleeding band (4)";
    }
    return scoreResult({
      score,
      maxScore: 10,
      label,
      severity,
      interpretation: `ATRIA bleeding score ${score}/10.`,
      clinicalSignificance:
        "Higher scores associate with higher major bleeding rates on warfarin in AF cohorts.",
      limitations:
        "Derived on warfarin; HAS-BLED remains widely used. Do not withhold anticoagulation based on score alone when stroke risk is high.",
      recommendations: [
        "Address modifiable bleeding risks (BP, alcohol, interacting drugs, falls review).",
        "Compare with CHA₂DS₂-VASc for net clinical benefit discussion.",
      ],
    });
  },
};
