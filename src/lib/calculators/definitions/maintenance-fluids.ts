import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const maintenanceFluids: CalculatorDefinition = {
  slug: "maintenance-fluids",
  title: "Maintenance Fluid Calculations (4-2-1)",
  shortName: "4-2-1",
  description:
    "Estimates hourly maintenance IV fluid rate using the Holliday–Segar 4-2-1 rule.",
  category: "general",
  icon: "droplets",
  clinicalApplication:
    "Educational maintenance fluid estimate. Always individualise for illness, electrolytes, and local paediatric protocols.",
  evidence: {
    version: "Holliday–Segar / 4-2-1 hourly rule",
    intendedPopulation: "Children and adults for maintenance fluid teaching estimates.",
    exclusions: [
      "Shock — use resuscitation fluids first",
      "SIADH risk / neurosurgical patients needing fluid restriction protocols",
      "Severe dehydration without deficit replacement plan",
    ],
    references: [
      {
        title: "The maintenance need for water in parenteral fluid therapy",
        citation: "Holliday MA, Segar WE. Pediatrics. 1957;19(5):823–832.",
        url: "https://pubmed.ncbi.nlm.nih.gov/13431307/",
      },
      {
        title: "NICE IV fluid therapy in children context",
        citation: "NICE NG29 Intravenous fluid therapy in children and young people in hospital.",
        url: "https://www.nice.org.uk/guidance/ng29",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "weight", label: "Weight", type: "number", suffix: "kg", min: 1, max: 200, step: 0.1 },
  ],
  calculate: (values) => {
    const w = asNumber(values.weight);
    let hourly = 0;
    if (w <= 10) hourly = 4 * w;
    else if (w <= 20) hourly = 40 + 2 * (w - 10);
    else hourly = 60 + 1 * (w - 20);
    const daily = hourly * 24;
    return formulaResult({
      value: hourly,
      unit: "mL/h",
      digits: 1,
      label: "Estimated maintenance rate (4-2-1)",
      interpretation: `≈ ${roundTo(hourly, 1)} mL/h (≈ ${roundTo(daily, 0)} mL/day).`,
      clinicalSignificance:
        "Provides a starting maintenance estimate only. Isotonic fluids are preferred in many paediatric protocols to reduce hyponatraemia risk.",
      limitations:
        "Does not include deficit, ongoing losses, or fever adjustments. Cap rates in large adults per local practice.",
      details: [
        { label: "Weight", value: `${w} kg` },
        { label: "Hourly", value: `${roundTo(hourly, 1)} mL/h` },
        { label: "Daily", value: `${roundTo(daily, 0)} mL/day` },
      ],
      recommendations: [
        "Choose fluid type and additives using local guidelines.",
        "Monitor sodium, input/output, and clinical volume status.",
      ],
    });
  },
};
