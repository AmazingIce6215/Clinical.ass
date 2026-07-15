import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const bmiBsaDubois: CalculatorDefinition = {
  slug: "bmi-bsa-dubois",
  title: "BMI and BSA (Du Bois)",
  shortName: "BMI/BSA DuBois",
  description:
    "Calculates BMI and body surface area using the Du Bois & Du Bois formula.",
  category: "general",
  icon: "scale",
  clinicalApplication:
    "Alternative BSA estimate used in some dosing and physiology contexts.",
  evidence: {
    version: "Du Bois BSA 1916; BMI Quetelet",
    intendedPopulation: "Adults for educational BSA/BMI estimates.",
    exclusions: [
      "Neonates without specialised charts",
      "Amputation/oedema without adjusted methods",
    ],
    references: [
      {
        title: "A formula to estimate the approximate surface area if height and weight be known",
        citation: "Du Bois D, Du Bois EF. Arch Intern Med. 1916;17:863–871.",
        url: "https://doi.org/10.1001/archinte.1916.00080130010002",
      },
      {
        title: "Mosteller simplified BSA comparison context",
        citation: "Mosteller RD. N Engl J Med. 1987;317(17):1098.",
        url: "https://pubmed.ncbi.nlm.nih.gov/3657876/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "weight", label: "Weight", type: "number", suffix: "kg", min: 1, max: 400, step: 0.1 },
    { id: "height", label: "Height", type: "number", suffix: "cm", min: 30, max: 250, step: 0.1 },
  ],
  calculate: (values) => {
    const weight = asNumber(values.weight);
    const heightCm = asNumber(values.height);
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    const bsa = 0.007184 * weight ** 0.425 * heightCm ** 0.725;
    let label = "Healthy weight range (BMI)";
    let severity: "low" | "moderate" | "high" = "low";
    if (bmi < 18.5) {
      label = "Underweight range (BMI)";
      severity = "moderate";
    } else if (bmi >= 30) {
      label = "Obesity range (BMI)";
      severity = "high";
    } else if (bmi >= 25) {
      label = "Overweight range (BMI)";
      severity = "moderate";
    }
    return formulaResult({
      value: bmi,
      unit: "kg/m²",
      digits: 1,
      label,
      severity,
      interpretation: `BMI ${roundTo(bmi, 1)} kg/m²; BSA (Du Bois) ${roundTo(bsa, 2)} m².`,
      clinicalSignificance:
        "Du Bois BSA may differ slightly from Mosteller; use the formula specified by the dosing protocol.",
      limitations: "Same BMI limitations regarding body composition.",
      details: [
        { label: "BMI", value: `${roundTo(bmi, 1)}` },
        { label: "BSA Du Bois", value: `${roundTo(bsa, 2)} m²` },
      ],
      recommendations: [
        "Confirm which BSA equation the protocol requires.",
        "Use measured height/weight for dosing-critical calculations.",
      ],
    });
  },
};
