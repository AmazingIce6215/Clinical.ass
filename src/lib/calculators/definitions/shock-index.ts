import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const shockIndex: CalculatorDefinition = {
  slug: "shock-index",
  title: "Shock Index",
  shortName: "SI",
  description: "Heart rate divided by systolic blood pressure as a simple hypoperfusion marker.",
  category: "emergency",
  icon: "activity",
  clinicalApplication:
    "Educational triage adjunct in trauma, haemorrhage, and sepsis teaching. Not a standalone disposition tool.",
  evidence: {
    version: "Classic shock index (HR/SBP)",
    intendedPopulation: "Adults in acute care where HR and SBP are available.",
    exclusions: [
      "Marked bradycardia or paced rhythms that distort the index",
      "Children without paediatric-specific interpretation",
    ],
    references: [
      {
        title: "A comparison of the shock index and conventional vital signs",
        citation: "Rady MY, Smithline HA, Blake H, Nowak R, Rivers E. Ann Emerg Med. 1994;24(4):685–690.",
        url: "https://pubmed.ncbi.nlm.nih.gov/8092595/",
      },
      {
        title: "Utility of the shock index in predicting mortality in traumatically injured patients",
        citation: "Cannon CM, et al. J Trauma. 2009;67(6):1426–1430.",
        url: "https://pubmed.ncbi.nlm.nih.gov/20009697/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "hr", label: "Heart rate", type: "number", suffix: "/min", min: 20, max: 250, step: 1 },
    { id: "sbp", label: "Systolic BP", type: "number", suffix: "mmHg", min: 40, max: 300, step: 1 },
  ],
  calculate: (values) => {
    const hr = asNumber(values.hr);
    const sbp = asNumber(values.sbp);
    if (sbp <= 0) throw new Error("Systolic BP must be greater than zero.");
    const si = hr / sbp;

    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Lower shock-index band";
    if (si >= 1.3) {
      severity = "severe";
      label = "Higher shock-index band";
    } else if (si >= 1.0) {
      severity = "high";
      label = "Elevated shock-index band";
    } else if (si >= 0.7) {
      severity = "moderate";
      label = "Intermediate shock-index band";
    }

    return formulaResult({
      value: si,
      digits: 2,
      label,
      severity,
      interpretation: `Shock index ${roundTo(si, 2)} (HR ${hr} / SBP ${sbp}).`,
      clinicalSignificance:
        "Values ≥0.9–1.0 have been associated with higher risk of critical illness in some cohorts, but cut-offs vary by population.",
      limitations:
        "Beta-blockers, anxiety, pain, and measurement error limit specificity. Always integrate with full assessment.",
      details: [
        { label: "Heart rate", value: `${hr}/min` },
        { label: "SBP", value: `${sbp} mmHg` },
        { label: "Shock index", value: `${roundTo(si, 2)}` },
      ],
      recommendations: [
        "Reassess airway, breathing, circulation and occult bleeding when the index is elevated.",
        "Do not use in isolation for transfusion or disposition decisions.",
      ],
    });
  },
};
