import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const bmiBsaMosteller: CalculatorDefinition = {
  slug: "bmi-bsa-mosteller",
  title: "BMI and BSA (Mosteller)",
  shortName: "BMI/BSA",
  description:
    "Calculates body mass index and body surface area using the Mosteller formula for dosing and nutritional assessment.",
  category: "general",
  icon: "scale",
  clinicalApplication:
    "Supports weight-based and surface-area-based dosing estimates and nutritional context. Always confirm units and clinical indication for dosing.",
  evidence: {
    version: "BMI (Quetelet) and BSA Mosteller 1987",
    intendedPopulation:
      "Adults and older children where BMI or Mosteller BSA is used for educational dosing or anthropometric estimates.",
    exclusions: [
      "Neonates and very young children without paediatric-specific charts",
      "Amputation, severe oedema, or pregnancy where weight poorly reflects lean mass",
      "Use of BSA for drugs that require a validated alternative dosing method",
    ],
    references: [
      {
        title: "Simplified calculation of body-surface area",
        citation: "Mosteller RD. N Engl J Med. 1987;317(17):1098.",
        url: "https://pubmed.ncbi.nlm.nih.gov/3657876/",
      },
      {
        title: "Quetelet index as a measure of fatness",
        citation: "Garrow JS, Webster J. Int J Obes. 1985;9(2):147–153.",
        url: "https://pubmed.ncbi.nlm.nih.gov/4030199/",
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
    const bsa = Math.sqrt((heightCm * weight) / 3600);

    let label = "Healthy weight range (BMI)";
    let severity: "low" | "moderate" | "high" | "severe" = "low";
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
      interpretation: `BMI ${roundTo(bmi, 1)} kg/m²; BSA (Mosteller) ${roundTo(bsa, 2)} m².`,
      clinicalSignificance:
        "WHO adult BMI bands are a population screening tool. BSA is commonly used for selected chemotherapy and other surface-area dosing—verify the drug-specific method.",
      limitations:
        "BMI does not distinguish fat from muscle. Mosteller BSA is an estimate and may differ from Du Bois or other formulas.",
      details: [
        { label: "BMI", value: `${roundTo(bmi, 1)} kg/m²` },
        { label: "BSA (Mosteller)", value: `${roundTo(bsa, 2)} m²` },
        { label: "Weight", value: `${weight} kg` },
        { label: "Height", value: `${heightCm} cm` },
      ],
      recommendations: [
        "Confirm measured weight and height rather than patient report when dosing depends on the result.",
        "Use local dosing protocols and consider renal/hepatic function separately.",
      ],
    });
  },
};
