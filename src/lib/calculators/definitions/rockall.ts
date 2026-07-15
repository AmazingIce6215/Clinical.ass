import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const rockall: CalculatorDefinition = {
  slug: "rockall",
  title: "Rockall Score (GI Bleed)",
  shortName: "Rockall",
  description:
    "Predicts mortality after upper GI bleeding using clinical and endoscopic variables.",
  category: "gastroenterology",
  icon: "droplets",
  clinicalApplication:
    "Post-endoscopy risk discussion for rebleeding and mortality. Pre-endoscopy partial score uses clinical variables only.",
  evidence: {
    version: "Complete Rockall score (clinical + endoscopic)",
    intendedPopulation: "Adults with acute upper GI bleeding.",
    exclusions: [
      "Lower GI bleeding only",
      "Children",
    ],
    references: [
      {
        title: "Risk assessment after acute upper gastrointestinal haemorrhage",
        citation: "Rockall TA, et al. Gut. 1996;38(3):316–321.",
        url: "https://pubmed.ncbi.nlm.nih.gov/8675081/",
      },
      {
        title: "International consensus recommendations on UGIB",
        citation: "Barkun AN, et al. Ann Intern Med. 2019;171(11):805–822.",
        url: "https://pubmed.ncbi.nlm.nih.gov/31634917/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "age",
      label: "Age",
      type: "select",
      options: [
        { label: "< 60 (0)", value: "0", points: 0 },
        { label: "60–79 (1)", value: "1", points: 1 },
        { label: "≥ 80 (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "shock",
      label: "Shock",
      type: "select",
      options: [
        { label: "No shock, SBP ≥100 and HR <100 (0)", value: "0", points: 0 },
        { label: "Tachycardia HR ≥100 with SBP ≥100 (1)", value: "1", points: 1 },
        { label: "Hypotension SBP <100 (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "comorbidity",
      label: "Comorbidity",
      type: "select",
      options: [
        { label: "No major comorbidity (0)", value: "0", points: 0 },
        { label: "Cardiac failure, IHD, or other major comorbidity (2)", value: "2", points: 2 },
        { label: "Renal failure, liver failure, or disseminated malignancy (3)", value: "3", points: 3 },
      ],
    },
    {
      id: "diagnosis",
      label: "Endoscopic diagnosis",
      type: "select",
      options: [
        { label: "Mallory–Weiss tear or no lesion / no SRH (0)", value: "0", points: 0 },
        { label: "All other diagnoses (1)", value: "1", points: 1 },
        { label: "Malignancy of upper GI tract (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "srh",
      label: "Major stigmata of recent haemorrhage",
      type: "select",
      options: [
        { label: "None or dark spot only (0)", value: "0", points: 0 },
        { label: "Blood in upper GI tract, adherent clot, visible/spurting vessel (2)", value: "2", points: 2 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, rockall.inputs);
    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Lower Rockall band (0–2)";
    if (score >= 8) {
      severity = "severe";
      label = "Very high Rockall band (≥8)";
    } else if (score >= 5) {
      severity = "high";
      label = "Higher Rockall band (5–7)";
    } else if (score >= 3) {
      severity = "moderate";
      label = "Intermediate Rockall band (3–4)";
    }
    return scoreResult({
      score,
      maxScore: 11,
      label,
      severity,
      interpretation: `Complete Rockall score ${score}/11.`,
      clinicalSignificance:
        "Higher scores associate with higher mortality after UGIB; low scores may support earlier discharge planning after definitive care.",
      limitations:
        "Requires endoscopy for the complete score. Blatchford is preferred for pre-endoscopy disposition in many pathways.",
      recommendations:
        score <= 2
          ? ["Consider early diet and discharge planning if bleeding controlled.", "Safety-net for rebleeding symptoms."]
          : [
              "Inpatient monitoring and senior GI review are commonly required.",
              "Optimise resuscitation, PPI, and rebleeding surveillance.",
            ],
    });
  },
};
