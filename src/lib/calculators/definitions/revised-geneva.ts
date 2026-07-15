import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const revisedGeneva: CalculatorDefinition = {
  slug: "revised-geneva",
  title: "Revised Geneva Score for PE",
  shortName: "rGeneva",
  description:
    "Clinical prediction rule for pulmonary embolism probability using objective criteria.",
  category: "pulmonology",
  icon: "air-vent",
  clinicalApplication:
    "Pre-test probability assessment for suspected PE alongside D-dimer and imaging pathways.",
  evidence: {
    version: "Revised Geneva score (Le Gal)",
    intendedPopulation: "Adults with suspected PE in emergency or acute medical settings.",
    exclusions: [
      "Confirmed PE (use severity scores such as PESI)",
      "Pregnancy without specialist pathway",
    ],
    references: [
      {
        title: "Prediction of pulmonary embolism in the emergency department: the revised Geneva score",
        citation: "Le Gal G, et al. Ann Intern Med. 2006;144(3):165–171.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16461960/",
      },
      {
        title: "ESC PE guidelines clinical probability assessment",
        citation: "Konstantinides SV, et al. Eur Heart J. 2020;41(4):543–603.",
        url: "https://pubmed.ncbi.nlm.nih.gov/31504429/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age", label: "Age > 65 years (1)", type: "boolean" },
    { id: "prior_vte", label: "Previous DVT or PE (3)", type: "boolean" },
    { id: "surgery", label: "Surgery or fracture within 1 month (2)", type: "boolean" },
    { id: "malignancy", label: "Active malignancy (2)", type: "boolean" },
    { id: "unilateral_pain", label: "Unilateral lower limb pain (3)", type: "boolean" },
    { id: "hemoptysis", label: "Hemoptysis (2)", type: "boolean" },
    {
      id: "hr",
      label: "Heart rate",
      type: "select",
      options: [
        { label: "< 75/min (0)", value: "0", points: 0 },
        { label: "75–94/min (3)", value: "3", points: 3 },
        { label: "≥ 95/min (5)", value: "5", points: 5 },
      ],
    },
    { id: "pain_edema", label: "Pain on deep venous palpation and unilateral edema (4)", type: "boolean" },
  ],
  calculate: (values) => {
    const score =
      (values.age ? 1 : 0) +
      (values.prior_vte ? 3 : 0) +
      (values.surgery ? 2 : 0) +
      (values.malignancy ? 2 : 0) +
      (values.unilateral_pain ? 3 : 0) +
      (values.hemoptysis ? 2 : 0) +
      (values.pain_edema ? 4 : 0) +
      sumSelectPoints(values, [{ id: "hr", options: revisedGeneva.inputs[6].options }]);

    let severity: "low" | "moderate" | "high" = "low";
    let label = "Low probability (0–3)";
    if (score >= 11) {
      severity = "high";
      label = "High probability (≥11)";
    } else if (score >= 4) {
      severity = "moderate";
      label = "Intermediate probability (4–10)";
    }

    return scoreResult({
      score,
      maxScore: 22,
      label,
      severity,
      interpretation: `Revised Geneva score ${score} — ${label}.`,
      clinicalSignificance:
        "Probability category guides D-dimer and imaging strategy under local PE pathways.",
      limitations:
        "Performance depends on prevalence. Clinical gestalt still matters for intermediate groups.",
      recommendations:
        score <= 3
          ? ["Consider D-dimer; if negative, PE may be excluded in low-probability patients.", "Reassess if clinical course changes."]
          : score <= 10
            ? ["Use D-dimer or proceed to imaging per local protocol.", "Do not delay care for unstable patients."]
            : ["Imaging (CTPA/V-Q) is typically required.", "Stabilise and involve senior review if hypotensive or hypoxic."],
    });
  },
};
