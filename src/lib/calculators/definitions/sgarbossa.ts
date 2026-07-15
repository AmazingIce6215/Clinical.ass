import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const sgarbossa: CalculatorDefinition = {
  slug: "sgarbossa",
  title: "Sgarbossa Criteria (MI in LBBB)",
  shortName: "Sgarbossa",
  description:
    "ECG criteria for diagnosing acute MI in the presence of left bundle branch block.",
  category: "cardiology",
  icon: "heart-pulse",
  clinicalApplication:
    "Supports STEMI-equivalent recognition in LBBB/paced rhythms when applicable.",
  evidence: {
    version: "Original Sgarbossa score (0–5); ≥3 suggests MI",
    intendedPopulation: "Patients with LBBB (or ventricular paced rhythm) and suspected ACS.",
    exclusions: [
      "Normal conduction without LBBB",
      "Replacement for clinical judgment and serial ECGs/troponin",
    ],
    references: [
      {
        title: "Electrocardiographic diagnosis of evolving acute myocardial infarction in the presence of left bundle-branch block",
        citation: "Sgarbossa EB, et al. N Engl J Med. 1996;334(8):481–487.",
        url: "https://pubmed.ncbi.nlm.nih.gov/8559200/",
      },
      {
        title: "Smith-modified Sgarbossa criteria context",
        citation: "Smith SW, et al. Ann Emerg Med. 2012;60(6):766–776.",
        url: "https://pubmed.ncbi.nlm.nih.gov/22939607/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "concordant_ste",
      label: "Concordant ST elevation ≥ 1 mm in leads with positive QRS",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (5)", value: "5", points: 5 },
      ],
    },
    {
      id: "concordant_std",
      label: "Concordant ST depression ≥ 1 mm in V1–V3",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (3)", value: "3", points: 3 },
      ],
    },
    {
      id: "discordant_ste",
      label: "Excessively discordant ST elevation ≥ 5 mm",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (2)", value: "2", points: 2 },
      ],
    },
  ],
  calculate: (values) => {
    const score =
      (values.concordant_ste === "5" ? 5 : 0) +
      (values.concordant_std === "3" ? 3 : 0) +
      (values.discordant_ste === "2" ? 2 : 0);
    const positive = score >= 3;
    return scoreResult({
      score,
      maxScore: 10,
      label: positive
        ? "Sgarbossa positive (≥3) — MI more likely"
        : "Sgarbossa negative (<3) — does not rule out MI",
      severity: positive ? "high" : "low",
      interpretation: `Sgarbossa score ${score}.`,
      clinicalSignificance:
        "Score ≥3 is specific for MI in LBBB but insensitive; modified criteria improve sensitivity.",
      limitations:
        "Discordant STE ≥5 mm is the least specific criterion. Consider Smith-modified ratio rules.",
      recommendations: positive
        ? [
            "Activate local STEMI/ACS pathway and urgent cardiology review.",
            "Compare with prior ECGs when available.",
          ]
        : [
            "Continue ACS evaluation with serial ECGs and troponin.",
            "Consider modified Sgarbossa if suspicion remains high.",
          ],
    });
  },
};
