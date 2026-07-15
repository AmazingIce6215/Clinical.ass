import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const perc: CalculatorDefinition = {
  slug: "perc",
  title: "PERC Rule for Pulmonary Embolism",
  shortName: "PERC",
  description:
    "Eight criteria used to identify very low-risk patients in whom PE work-up may be deferred when pre-test probability is already low.",
  category: "pulmonology",
  icon: "air-vent",
  clinicalApplication:
    "Only after clinician gestalt that PE probability is low. A single positive criterion means PERC cannot rule out PE.",
  evidence: {
    version: "PERC rule (Kline) eight criteria",
    intendedPopulation:
      "Adults with low clinical suspicion for PE in emergency settings where PERC is appropriate.",
    exclusions: [
      "Intermediate or high pre-test probability of PE",
      "Pregnancy (PERC not validated for this use)",
      "Use to stop work-up when suspicion is not truly low",
    ],
    references: [
      {
        title: "Clinical criteria to prevent unnecessary diagnostic testing in emergency department patients with suspected pulmonary embolism",
        citation: "Kline JA, et al. J Thromb Haemost. 2004;2(8):1247–1255.",
        url: "https://pubmed.ncbi.nlm.nih.gov/15304025/",
      },
      {
        title: "Prospective multicenter evaluation of the pulmonary embolism rule-out criteria",
        citation: "Kline JA, et al. J Thromb Haemost. 2008;6(5):772–780.",
        url: "https://pubmed.ncbi.nlm.nih.gov/18318689/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age", label: "Age ≥ 50 years", type: "boolean" },
    { id: "hr", label: "Heart rate ≥ 100/min", type: "boolean" },
    { id: "o2", label: "O₂ saturation on room air < 95%", type: "boolean" },
    { id: "leg_swelling", label: "Unilateral leg swelling", type: "boolean" },
    { id: "hemoptysis", label: "Hemoptysis", type: "boolean" },
    { id: "surgery", label: "Recent surgery or trauma (≤ 4 weeks requiring treatment)", type: "boolean" },
    { id: "prior_vte", label: "Prior PE or DVT", type: "boolean" },
    { id: "hormone", label: "Hormone use (OCP, HRT, estrogen)", type: "boolean" },
  ],
  calculate: (values) => {
    const positives = sumBooleanFields(values, [
      "age",
      "hr",
      "o2",
      "leg_swelling",
      "hemoptysis",
      "surgery",
      "prior_vte",
      "hormone",
    ]);
    const negative = positives === 0;
    return scoreResult({
      score: positives,
      maxScore: 8,
      label: negative
        ? "PERC negative — PE work-up may be deferred if pre-test probability is low"
        : "PERC positive — cannot rule out PE with PERC alone",
      severity: negative ? "low" : "moderate",
      interpretation: negative
        ? "All PERC criteria absent."
        : `${positives} PERC criterion/criteria present.`,
      clinicalSignificance:
        "When clinical suspicion is already low and PERC is entirely negative, further PE testing may be avoided in appropriate ED populations.",
      limitations:
        "Unsafe if applied to non-low probability patients. Does not replace shared decision-making or local pathways.",
      recommendations: negative
        ? [
            "Confirm that clinician pre-test probability is low before stopping PE evaluation.",
            "Reassess if symptoms evolve or alternative high-risk features appear.",
          ]
        : [
            "Continue PE risk stratification (e.g. Wells/Geneva) and testing as indicated.",
            "Do not interpret a positive PERC as confirming PE.",
          ],
    });
  },
};
