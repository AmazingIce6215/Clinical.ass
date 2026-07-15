import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const saag: CalculatorDefinition = {
  slug: "saag",
  title: "Serum-Ascites Albumin Gradient (SAAG)",
  shortName: "SAAG",
  description:
    "Classifies ascites as high-gradient (portal hypertension) or low-gradient using albumin values.",
  category: "hepatology",
  icon: "droplets",
  clinicalApplication:
    "First-line interpretation of new ascites fluid analysis alongside cell count and culture.",
  evidence: {
    version: "SAAG = serum albumin − ascites albumin",
    intendedPopulation: "Adults with new or unexplained ascites undergoing paracentesis.",
    exclusions: [
      "Mislabeled samples or non-simultaneous labs",
      "Sole diagnosis without cell count, culture, and clinical context",
    ],
    references: [
      {
        title: "The serum-ascites albumin gradient is superior to the exudate-transudate concept",
        citation: "Runyon BA, et al. Ann Intern Med. 1992;117(3):215–220.",
        url: "https://pubmed.ncbi.nlm.nih.gov/1616215/",
      },
      {
        title: "AASLD ascites guidance",
        citation: "Biggins SW, et al. Hepatology. 2021;74(2):1014–1048.",
        url: "https://pubmed.ncbi.nlm.nih.gov/33900049/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "serum_alb",
      label: "Serum albumin",
      type: "number",
      suffix: "g/dL",
      min: 0.5,
      max: 6,
      step: 0.1,
      helpText: "g/dL (g/L ÷ 10).",
    },
    {
      id: "ascites_alb",
      label: "Ascites albumin",
      type: "number",
      suffix: "g/dL",
      min: 0.1,
      max: 5,
      step: 0.1,
    },
  ],
  calculate: (values) => {
    const serum = asNumber(values.serum_alb);
    const ascites = asNumber(values.ascites_alb);
    const value = serum - ascites;
    const high = value >= 1.1;
    return formulaResult({
      value,
      unit: "g/dL",
      digits: 2,
      label: high
        ? "High SAAG (≥1.1) — portal hypertension pattern"
        : "Low SAAG (<1.1) — non-portal hypertension pattern",
      severity: high ? "moderate" : "low",
      interpretation: `SAAG ${roundTo(value, 2)} g/dL.`,
      clinicalSignificance:
        "High SAAG suggests portal hypertension (cirrhosis, heart failure, Budd–Chiari). Low SAAG suggests peritoneal carcinomatosis, TB, pancreatitis, nephrosis, etc.",
      limitations:
        "Mixed ascites can confuse classification. Always interpret with PMN count for SBP.",
      details: [
        { label: "Serum albumin", value: `${serum} g/dL` },
        { label: "Ascites albumin", value: `${ascites} g/dL` },
        { label: "SAAG", value: `${roundTo(value, 2)} g/dL` },
      ],
      recommendations: [
        "Send cell count with differential and culture in blood culture bottles.",
        "Investigate etiology based on SAAG category and clinical picture.",
      ],
    });
  },
};
