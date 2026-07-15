import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const parkland: CalculatorDefinition = {
  slug: "parkland",
  title: "Parkland Formula (Burn Fluid)",
  shortName: "Parkland",
  description:
    "Estimates 24-hour crystalloid volume for major burns using TBSA and weight.",
  category: "emergency",
  icon: "droplets",
  clinicalApplication:
    "Initial fluid estimate for major thermal burns. Titrate to urine output and clinical response.",
  evidence: {
    version: "Parkland 4 mL × kg × %TBSA (half in first 8 h from injury)",
    intendedPopulation: "Adults and children with major burns needing formal fluid resuscitation teaching.",
    exclusions: [
      "Minor burns not requiring formal Parkland resuscitation",
      "Electrical injury / inhalation with different needs",
      "Use without burn-centre guidance for large TBSA",
    ],
    references: [
      {
        title: "Fluid volume and electrolyte changes in the early postburn period",
        citation: "Baxter CR, Shires T. Clin Plast Surg. context of Parkland formula teaching.",
        url: "https://pubmed.ncbi.nlm.nih.gov/4955879/",
      },
      {
        title: "ABA burn shock resuscitation guidance context",
        citation: "American Burn Association educational materials on Parkland-based resuscitation.",
        url: "https://ameriburn.org/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "weight", label: "Weight", type: "number", suffix: "kg", min: 1, max: 250, step: 0.1 },
    {
      id: "tbsa",
      label: "TBSA burned",
      type: "number",
      suffix: "%",
      min: 1,
      max: 100,
      step: 0.5,
      helpText: "Partial- and full-thickness burns; use rule of nines / Lund-Browder.",
    },
    {
      id: "hours_since",
      label: "Hours since injury (optional)",
      type: "number",
      suffix: "hours",
      min: 0,
      max: 24,
      step: 0.5,
      required: false,
      helpText: "If provided, remaining first-8h volume is adjusted.",
    },
  ],
  calculate: (values) => {
    const weight = asNumber(values.weight);
    const tbsa = asNumber(values.tbsa);
    const total = 4 * weight * tbsa;
    const first8 = total / 2;
    const next16 = total / 2;
    const hours =
      values.hours_since === "" || values.hours_since === undefined || values.hours_since === null
        ? 0
        : asNumber(values.hours_since);

    return formulaResult({
      value: total,
      unit: "mL / 24 h",
      digits: 0,
      label: "Estimated 24-hour Parkland volume",
      interpretation: `Total ${roundTo(total, 0)} mL crystalloid over 24 h from time of injury (≈ ${roundTo(first8, 0)} mL in first 8 h, ${roundTo(next16, 0)} mL in next 16 h).`,
      clinicalSignificance:
        "Starting estimate only. Titrate primarily to urine output (~0.5 mL/kg/h adults) and avoid over-resuscitation.",
      limitations:
        "Does not include maintenance fluids in children the same way. Inhalation injury and delays change needs.",
      details: [
        { label: "Weight", value: `${weight} kg` },
        { label: "TBSA", value: `${tbsa}%` },
        { label: "24 h total", value: `${roundTo(total, 0)} mL` },
        { label: "First 8 h", value: `${roundTo(first8, 0)} mL` },
        { label: "Next 16 h", value: `${roundTo(next16, 0)} mL` },
        ...(hours > 0
          ? [
              {
                label: "Elapsed since injury",
                value: `${hours} h (adjust remaining volume with burn team)`,
              },
            ]
          : []),
      ],
      recommendations: [
        "Use lactated Ringer’s or local preferred crystalloid and involve a burn service for major burns.",
        "Monitor urine output, lactate, and fluid creep carefully.",
      ],
    });
  },
};
