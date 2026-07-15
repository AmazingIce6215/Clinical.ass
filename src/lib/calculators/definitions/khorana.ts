import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const khorana: CalculatorDefinition = {
  slug: "khorana",
  title: "Khorana Score (Cancer VTE)",
  shortName: "Khorana",
  description:
    "Estimates chemotherapy-associated VTE risk in ambulatory cancer patients.",
  category: "hematology",
  icon: "syringe",
  clinicalApplication:
    "Supports discussion of outpatient VTE risk and possible prophylaxis in selected cancers.",
  evidence: {
    version: "Khorana risk score",
    intendedPopulation: "Ambulatory patients starting chemotherapy for solid tumours/lymphoma.",
    exclusions: [
      "Already on therapeutic anticoagulation",
      "Primary brain tumours and some settings with different risk tools",
    ],
    references: [
      {
        title: "Development and validation of a predictive model for chemotherapy-associated thrombosis",
        citation: "Khorana AA, et al. Blood. 2008;111(10):4902–4907.",
        url: "https://pubmed.ncbi.nlm.nih.gov/18216292/",
      },
      {
        title: "ASCO VTE prophylaxis guidelines",
        citation: "Key NS, et al. J Clin Oncol. 2020;38(5):496–520.",
        url: "https://pubmed.ncbi.nlm.nih.gov/31381464/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "site",
      label: "Cancer site risk category",
      type: "select",
      options: [
        { label: "Very high risk (stomach, pancreas) (2)", value: "2", points: 2 },
        { label: "High risk (lung, lymphoma, gynaecologic, bladder, testicular) (1)", value: "1", points: 1 },
        { label: "Other sites (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "plt",
      label: "Pre-chemo platelet count ≥ 350 ×10⁹/L",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (1)", value: "1", points: 1 },
      ],
    },
    {
      id: "hb",
      label: "Hemoglobin < 10 g/dL or using ESA",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (1)", value: "1", points: 1 },
      ],
    },
    {
      id: "wbc",
      label: "Pre-chemo WBC > 11 ×10⁹/L",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (1)", value: "1", points: 1 },
      ],
    },
    {
      id: "bmi",
      label: "BMI ≥ 35 kg/m²",
      type: "select",
      options: [
        { label: "No (0)", value: "0", points: 0 },
        { label: "Yes (1)", value: "1", points: 1 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, khorana.inputs);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Low VTE risk band (0)";
    if (score >= 3) {
      severity = "high";
      label = "High VTE risk band (≥3)";
    } else if (score >= 1) {
      severity = "moderate";
      label = "Intermediate VTE risk band (1–2)";
    }
    return scoreResult({
      score,
      maxScore: 6,
      label,
      severity,
      interpretation: `Khorana score ${score}/6.`,
      clinicalSignificance:
        "Higher scores identify ambulatory cancer patients with elevated VTE risk; prophylaxis decisions are individualised.",
      limitations:
        "Does not capture all cancer- and treatment-specific risks. Bleeding risk not scored.",
      recommendations:
        score >= 2
          ? [
              "Discuss risks/benefits of outpatient prophylaxis per oncology guidance.",
              "Educate about VTE symptoms and encourage mobility.",
            ]
          : [
              "Routine pharmacologic prophylaxis often not indicated based on score alone.",
              "Reassess if cancer therapy or status changes.",
            ],
    });
  },
};
