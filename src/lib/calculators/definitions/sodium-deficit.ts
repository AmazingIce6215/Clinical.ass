import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const sodiumDeficit: CalculatorDefinition = {
  slug: "sodium-deficit-hyponatremia",
  title: "Sodium Deficit (Hyponatremia)",
  shortName: "Na deficit",
  description:
    "Estimates sodium deficit to raise serum sodium toward a chosen target.",
  category: "nephrology",
  icon: "flask-conical",
  clinicalApplication:
    "Educational estimate only. Correction rate limits and underlying cause dominate management.",
  evidence: {
    version: "Na deficit ≈ TBW × (desired Na − current Na)",
    intendedPopulation: "Adults with hyponatremia for teaching replacement estimates.",
    exclusions: [
      "Symptomatic severe hyponatremia needing controlled hypertonic saline protocols",
      "Overly rapid correction planning",
      "Children without paediatric TBW factors",
    ],
    references: [
      {
        title: "Hyponatremia",
        citation: "Adrogué HJ, Madias NE. N Engl J Med. 2000;342(21):1581–1589.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10824078/",
      },
      {
        title: "European hyponatraemia clinical practice guidance",
        citation: "Spasovski G, et al. Eur J Endocrinol. 2014.",
        url: "https://pubmed.ncbi.nlm.nih.gov/24569125/",
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
        { label: "Male (0.6 × wt)", value: "male", points: 0 },
        { label: "Female (0.5 × wt)", value: "female", points: 0 },
      ],
    },
    { id: "weight", label: "Weight", type: "number", suffix: "kg", min: 20, max: 250, step: 0.1 },
    { id: "current_na", label: "Current sodium", type: "number", suffix: "mmol/L", min: 90, max: 135, step: 0.1 },
    {
      id: "desired_na",
      label: "Desired sodium",
      type: "number",
      suffix: "mmol/L",
      min: 120,
      max: 140,
      step: 0.1,
      helpText: "Often a modest intermediate target, not necessarily 140 at once.",
    },
  ],
  calculate: (values) => {
    const weight = asNumber(values.weight);
    const current = asNumber(values.current_na);
    const desired = asNumber(values.desired_na);
    if (desired <= current) throw new Error("Desired sodium must be greater than current sodium.");
    const tbw = (values.sex === "female" ? 0.5 : 0.6) * weight;
    const deficit = tbw * (desired - current);
    return formulaResult({
      value: deficit,
      unit: "mmol",
      digits: 0,
      label: "Estimated sodium deficit",
      severity: current < 120 ? "high" : "moderate",
      interpretation: `≈ ${roundTo(deficit, 0)} mmol Na to raise from ${current} to ${desired}.`,
      clinicalSignificance:
        "Helps conceptualise replacement needs; actual change depends on fluid choice, ongoing losses, and ADH state.",
      limitations:
        "Does not dictate safe correction rate. Overcorrection risks osmotic demyelination.",
      details: [
        { label: "TBW", value: `${roundTo(tbw, 1)} L` },
        { label: "ΔNa", value: `${roundTo(desired - current, 1)}` },
        { label: "Deficit", value: `${roundTo(deficit, 0)} mmol` },
      ],
      recommendations: [
        "Limit correction carefully (commonly ≤8–10 mmol/L/24 h in chronic hyponatremia).",
        "Identify hypovolemic vs euvolemic vs hypervolemic causes first.",
      ],
    });
  },
};
