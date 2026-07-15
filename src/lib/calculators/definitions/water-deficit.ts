import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const waterDeficit: CalculatorDefinition = {
  slug: "water-deficit-hypernatremia",
  title: "Free Water Deficit (Hypernatremia)",
  shortName: "H2O deficit",
  description:
    "Estimates free water deficit in hypernatremia using total body water fraction.",
  category: "nephrology",
  icon: "droplets",
  clinicalApplication:
    "Educational starting estimate for free-water replacement. Correct slowly and reassess.",
  evidence: {
    version: "Deficit = TBW × ((Na/140) − 1); TBW ≈ 0.6×wt men, 0.5 women (common teaching)",
    intendedPopulation: "Adults with hypernatremia requiring free-water replacement estimates.",
    exclusions: [
      "Hypovolemic shock before volume resuscitation",
      "Rapid overcorrection without monitoring",
      "Children without paediatric TBW fractions",
    ],
    references: [
      {
        title: "Hypernatremia",
        citation: "Adrogué HJ, Madias NE. N Engl J Med. 2000;342(20):1493–1499.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10816188/",
      },
      {
        title: "Diagnosis and treatment of hypernatremia",
        citation: "Muhsin SA, Mount DB. Best Pract Res Clin Endocrinol Metab. 2016.",
        url: "https://pubmed.ncbi.nlm.nih.gov/27156761/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "sex",
      label: "Sex (TBW fraction)",
      type: "select",
      options: [
        { label: "Male (0.6 × weight)", value: "male", points: 0 },
        { label: "Female (0.5 × weight)", value: "female", points: 0 },
      ],
    },
    { id: "weight", label: "Weight", type: "number", suffix: "kg", min: 20, max: 250, step: 0.1 },
    { id: "na", label: "Serum sodium", type: "number", suffix: "mmol/L", min: 145, max: 200, step: 0.1 },
    {
      id: "goal_na",
      label: "Goal sodium",
      type: "number",
      suffix: "mmol/L",
      min: 140,
      max: 160,
      step: 0.1,
      required: false,
      helpText: "Default 140 if blank.",
    },
  ],
  calculate: (values) => {
    const weight = asNumber(values.weight);
    const na = asNumber(values.na);
    const goal =
      values.goal_na === "" || values.goal_na === undefined || values.goal_na === null
        ? 140
        : asNumber(values.goal_na);
    const fraction = values.sex === "female" ? 0.5 : 0.6;
    const tbw = fraction * weight;
    const deficit = tbw * (na / goal - 1);
    return formulaResult({
      value: deficit,
      unit: "L",
      digits: 2,
      label: "Estimated free water deficit",
      severity: na >= 160 ? "high" : "moderate",
      interpretation: `Free water deficit ≈ ${roundTo(deficit, 2)} L to reach Na ${goal}.`,
      clinicalSignificance:
        "Guides free-water replacement planning after haemodynamic resuscitation. Typical correction targets are cautious (e.g. ≤10 mmol/L/day in chronic hypernatremia).",
      limitations:
        "TBW fractions are estimates. Ongoing losses require dynamic adjustment.",
      details: [
        { label: "TBW", value: `${roundTo(tbw, 1)} L` },
        { label: "Na", value: `${na}` },
        { label: "Goal Na", value: `${goal}` },
        { label: "Deficit", value: `${roundTo(deficit, 2)} L` },
      ],
      recommendations: [
        "Choose enteral water or IV D5W per clinical context; monitor Na frequently.",
        "Treat underlying cause (renal/extrarenal water losses).",
      ],
    });
  },
};
