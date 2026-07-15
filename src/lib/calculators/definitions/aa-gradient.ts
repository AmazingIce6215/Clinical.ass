import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const aaGradient: CalculatorDefinition = {
  slug: "a-a-gradient",
  title: "A–a Oxygen Gradient",
  shortName: "A–a",
  description:
    "Estimates the alveolar–arterial oxygen gradient from ABG values and FiO₂.",
  category: "pulmonology",
  icon: "air-vent",
  clinicalApplication:
    "Supports teaching of hypoxemia mechanisms (V/Q mismatch, shunt, diffusion, low inspired O₂).",
  evidence: {
    version: "PAO₂ = FiO₂·(Patm − PH₂O) − PaCO₂/R; A–a = PAO₂ − PaO₂",
    intendedPopulation: "Adults with arterial blood gas and known inspired oxygen fraction.",
    exclusions: [
      "Venous blood gases mislabeled as arterial",
      "Altitude or circuit conditions without adjusting atmospheric pressure",
    ],
    references: [
      {
        title: "The A-a gradient",
        citation: "Hantzidiamantis PJ, Amaro E. StatPearls. 2023.",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK545153/",
      },
      {
        title: "Pulmonary gas exchange",
        citation: "West JB. Respiratory Physiology: The Essentials.",
        url: "https://pubmed.ncbi.nlm.nih.gov/7018788/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "pao2", label: "PaO₂", type: "number", suffix: "mmHg", min: 20, max: 600, step: 0.1 },
    { id: "paco2", label: "PaCO₂", type: "number", suffix: "mmHg", min: 10, max: 120, step: 0.1 },
    {
      id: "fio2",
      label: "FiO₂",
      type: "number",
      suffix: "fraction (0.21–1.0)",
      min: 0.21,
      max: 1,
      step: 0.01,
      helpText: "Room air = 0.21. 100% oxygen = 1.0.",
    },
    {
      id: "age",
      label: "Age (optional, for expected A–a)",
      type: "number",
      suffix: "years",
      min: 0,
      max: 120,
      step: 1,
      required: false,
    },
  ],
  calculate: (values) => {
    const pao2 = asNumber(values.pao2);
    const paco2 = asNumber(values.paco2);
    const fio2 = asNumber(values.fio2);
    const patm = 760;
    const ph2o = 47;
    const r = 0.8;
    const pao2Alveolar = fio2 * (patm - ph2o) - paco2 / r;
    const gradient = pao2Alveolar - pao2;
    const age =
      values.age === "" || values.age === undefined || values.age === null
        ? null
        : asNumber(values.age);
    const expected = age === null ? null : (age / 4) + 4;

    let severity: "low" | "moderate" | "high" = "low";
    let label = "A–a gradient near expected for many room-air adults";
    if (expected !== null && gradient > expected + 10) {
      severity = "high";
      label = "Widened A–a gradient vs age estimate";
    } else if (gradient > 20 && fio2 <= 0.21) {
      severity = "moderate";
      label = "Possibly widened A–a gradient on room air";
    }

    return formulaResult({
      value: gradient,
      unit: "mmHg",
      digits: 1,
      label,
      severity,
      interpretation: `A–a gradient ${roundTo(gradient, 1)} mmHg (PAO₂ ${roundTo(pao2Alveolar, 1)} − PaO₂ ${pao2}).`,
      clinicalSignificance:
        "A normal gradient with hypoxemia suggests low FiO₂ or hypoventilation; a widened gradient suggests V/Q mismatch, shunt, or diffusion limitation.",
      limitations:
        "Assumes sea-level Patm 760 mmHg, PH₂O 47, R 0.8. High FiO₂ widens the normal gradient.",
      details: [
        { label: "PAO₂", value: `${roundTo(pao2Alveolar, 1)} mmHg` },
        { label: "PaO₂", value: `${pao2} mmHg` },
        { label: "A–a gradient", value: `${roundTo(gradient, 1)} mmHg` },
        ...(expected !== null
          ? [{ label: "Rough age-expected A–a", value: `${roundTo(expected, 1)} mmHg` }]
          : []),
      ],
      recommendations: [
        "Interpret with clinical context, chest imaging, and response to oxygen.",
        "Confirm ABG is arterial and FiO₂ is accurate.",
      ],
    });
  },
};
