import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const osmolalGap: CalculatorDefinition = {
  slug: "osmolal-gap",
  title: "Osmolal Gap",
  shortName: "OG",
  description:
    "Compares measured serum osmolality with a calculated estimate to screen for unmeasured osmoles.",
  category: "nephrology",
  icon: "flask-conical",
  clinicalApplication:
    "Toxicology and metabolic teaching for suspected toxic alcohols, mannitol, or other osmoles.",
  evidence: {
    version: "Calculated osm ≈ 2·Na + glucose/18 + BUN/2.8 (US units) or SI equivalent",
    intendedPopulation: "Adults with simultaneous measured osmolality and chemistry panel.",
    exclusions: [
      "Use of mismatched units (mg/dL vs mmol/L) without conversion",
      "Delayed sampling after ethanol clearance when toxic alcohols remain",
    ],
    references: [
      {
        title: "An evaluation of the osmole gap as a screening test for toxic alcohol poisoning",
        citation: "Lynd LD, et al. BMC Emerg Med. 2008;8:5.",
        url: "https://pubmed.ncbi.nlm.nih.gov/18442409/",
      },
      {
        title: "Derivation and validation of a formula to calculate the contribution of ethanol to the osmolal gap",
        citation: "Purssell RA, et al. Ann Emerg Med. 2001;38(6):653–659.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11719745/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "measured", label: "Measured osmolality", type: "number", suffix: "mOsm/kg", min: 200, max: 450, step: 0.1 },
    { id: "na", label: "Sodium", type: "number", suffix: "mmol/L", min: 100, max: 180, step: 0.1 },
    {
      id: "glucose",
      label: "Glucose",
      type: "number",
      suffix: "mmol/L",
      min: 1,
      max: 60,
      step: 0.1,
      helpText: "Enter glucose in mmol/L (divide mg/dL by 18).",
    },
    {
      id: "urea",
      label: "Urea",
      type: "number",
      suffix: "mmol/L",
      min: 0.5,
      max: 60,
      step: 0.1,
      helpText: "Enter urea in mmol/L (BUN mg/dL ≈ urea mmol/L × 2.8).",
    },
    {
      id: "ethanol",
      label: "Ethanol (optional)",
      type: "number",
      suffix: "mmol/L",
      min: 0,
      max: 100,
      step: 0.1,
      required: false,
      helpText: "If known, include ethanol in mmol/L (mg/dL ÷ 4.6).",
    },
  ],
  calculate: (values) => {
    const measured = asNumber(values.measured);
    const na = asNumber(values.na);
    const glucose = asNumber(values.glucose);
    const urea = asNumber(values.urea);
    const ethanol =
      values.ethanol === "" || values.ethanol === undefined || values.ethanol === null
        ? 0
        : asNumber(values.ethanol);
    const calculated = 2 * na + glucose + urea + ethanol;
    const gap = measured - calculated;

    let severity: "low" | "moderate" | "high" = "low";
    let label = "Osmolal gap within a common reference band";
    if (gap > 20) {
      severity = "high";
      label = "Elevated osmolal gap";
    } else if (gap > 10) {
      severity = "moderate";
      label = "Borderline elevated osmolal gap";
    }

    return formulaResult({
      value: gap,
      unit: "mOsm/kg",
      digits: 1,
      label,
      severity,
      interpretation: `Osmolal gap ${roundTo(gap, 1)} (measured ${measured} − calculated ${roundTo(calculated, 1)}).`,
      clinicalSignificance:
        "A raised gap may suggest ethanol, methanol, ethylene glycol, isopropanol, mannitol, or lab error. Normal gap does not exclude late toxic-alcohol presentations.",
      limitations:
        "Calculated osm formulas vary. Always use SI/US unit consistency. Clinical toxicology decisions require more than the gap alone.",
      details: [
        { label: "Measured osm", value: `${measured}` },
        { label: "Calculated osm", value: `${roundTo(calculated, 1)}` },
        { label: "Gap", value: `${roundTo(gap, 1)}` },
      ],
      recommendations: [
        "Correlate with anion gap, blood gas, and exposure history.",
        "Seek toxicology advice early when toxic alcohols are possible.",
      ],
    });
  },
};
