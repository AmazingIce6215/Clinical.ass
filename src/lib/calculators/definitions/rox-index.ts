import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const roxIndex: CalculatorDefinition = {
  slug: "rox-index",
  title: "ROX Index (HFNC Failure Risk)",
  shortName: "ROX",
  description:
    "Ratio of SpO₂/FiO₂ to respiratory rate predicting risk of intubation on high-flow nasal oxygen.",
  category: "critical-care",
  icon: "air-vent",
  clinicalApplication:
    "Serial monitoring during HFNC for hypoxemic respiratory failure teaching.",
  evidence: {
    version: "ROX = (SpO₂/FiO₂) / RR",
    intendedPopulation: "Adults on HFNC for acute hypoxemic respiratory failure.",
    exclusions: [
      "Hypercapnic failure as primary process without adaptation",
      "Sole trigger for intubation without clinical judgment",
    ],
    references: [
      {
        title: "Predicting success of high-flow nasal cannula in pneumonia patients with hypoxemic respiratory failure: the utility of the ROX index",
        citation: "Roca O, et al. J Crit Care. 2016;35:200–205.",
        url: "https://pubmed.ncbi.nlm.nih.gov/27481760/",
      },
      {
        title: "An index combining respiratory rate and oxygenation to predict outcome of nasal high-flow therapy",
        citation: "Roca O, et al. Am J Respir Crit Care Med. 2019;199(11):1368–1376.",
        url: "https://pubmed.ncbi.nlm.nih.gov/30576221/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "spo2", label: "SpO₂", type: "number", suffix: "%", min: 50, max: 100, step: 1 },
    {
      id: "fio2",
      label: "FiO₂",
      type: "number",
      suffix: "fraction 0.21–1.0",
      min: 0.21,
      max: 1,
      step: 0.01,
    },
    { id: "rr", label: "Respiratory rate", type: "number", suffix: "/min", min: 8, max: 60, step: 1 },
  ],
  calculate: (values) => {
    const spo2 = asNumber(values.spo2);
    const fio2 = asNumber(values.fio2);
    const rr = asNumber(values.rr);
    if (fio2 <= 0 || rr <= 0) throw new Error("FiO₂ and RR must be greater than zero.");
    const value = spo2 / fio2 / rr;
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Higher ROX — lower failure risk band (≥4.88 at 12 h teaching cut-off)";
    if (value < 3.85) {
      severity = "high";
      label = "Lower ROX — higher HFNC failure risk band";
    } else if (value < 4.88) {
      severity = "moderate";
      label = "Intermediate ROX band — reassess frequently";
    }
    return formulaResult({
      value,
      digits: 2,
      label,
      severity,
      interpretation: `ROX index ${roundTo(value, 2)}.`,
      clinicalSignificance:
        "Lower ROX values, especially when persistent, associate with higher risk of HFNC failure and need for intubation in validation cohorts.",
      limitations:
        "Cut-offs vary by time point (2, 6, 12 h). Do not delay intubation for a borderline score if the patient is tiring.",
      details: [
        { label: "SpO₂", value: `${spo2}%` },
        { label: "FiO₂", value: `${fio2}` },
        { label: "RR", value: `${rr}` },
        { label: "ROX", value: `${roundTo(value, 2)}` },
      ],
      recommendations: [
        "Trend ROX with work of breathing and gas exchange.",
        "Escalate to senior/ICU review early if ROX falls or patient fatigues.",
      ],
    });
  },
};
