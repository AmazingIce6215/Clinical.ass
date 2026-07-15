import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const ottawaKnee: CalculatorDefinition = {
  slug: "ottawa-knee",
  title: "Ottawa Knee Rules",
  shortName: "Ottawa Knee",
  description:
    "Clinical decision rule for knee radiography after acute blunt knee injury.",
  category: "trauma",
  icon: "bone",
  clinicalApplication:
    "Reduces unnecessary knee radiographs when applied to appropriate acute injuries.",
  evidence: {
    version: "Ottawa Knee Rules",
    intendedPopulation: "Adults with acute knee injury (typically within 7 days).",
    exclusions: [
      "Injury > 7 days old without re-injury",
      "Altered sensorium",
      "Multiple trauma / distracting injuries in some protocols",
      "Age < 18 years (use paediatric adaptations)",
    ],
    references: [
      {
        title: "Decision rules for the use of radiography in acute knee injuries",
        citation: "Stiell IG, et al. JAMA. 1996;275(8):611–615.",
        url: "https://pubmed.ncbi.nlm.nih.gov/8594242/",
      },
      {
        title: "Implementation of the Ottawa Knee Rule",
        citation: "Stiell IG, et al. JAMA. 1997;278(23):2075–2079.",
        url: "https://pubmed.ncbi.nlm.nih.gov/9403421/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age_55", label: "Age ≥ 55 years", type: "boolean" },
    { id: "fibular_head", label: "Isolated tenderness of fibular head", type: "boolean" },
    { id: "patella", label: "Isolated tenderness of patella", type: "boolean" },
    { id: "flex_90", label: "Inability to flex knee to 90°", type: "boolean" },
    { id: "weight_bear", label: "Unable to bear weight both immediately and in ED (4 steps)", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, [
      "age_55",
      "fibular_head",
      "patella",
      "flex_90",
      "weight_bear",
    ]);
    const xray = score > 0;
    return scoreResult({
      score,
      maxScore: 5,
      label: xray ? "Knee radiograph indicated" : "Radiograph may not be required by Ottawa Knee Rules",
      severity: xray ? "moderate" : "low",
      interpretation: xray
        ? `${score} Ottawa Knee criterion/criteria present.`
        : "No Ottawa Knee criteria met.",
      clinicalSignificance:
        "High sensitivity for clinically important fractures in validation studies when applied correctly.",
      limitations:
        "Does not exclude soft-tissue injuries requiring MRI or specialist review.",
      recommendations: xray
        ? ["Obtain standard knee radiographs.", "Immobilise and arrange follow-up if fracture confirmed."]
        : ["Provide RICE advice and early physiotherapy if needed.", "Safety-net for inability to weight-bear or locking."],
    });
  },
};
