import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const blatchford: CalculatorDefinition = {
  slug: "blatchford",
  title: "Glasgow-Blatchford Score (GI Bleed)",
  shortName: "Blatchford",
  description:
    "Risk score for upper GI bleeding to estimate need for hospital-based intervention.",
  category: "gastroenterology",
  icon: "droplets",
  clinicalApplication:
    "Supports disposition teaching in non-variceal upper GI bleeding. Local pathways may use additional criteria.",
  evidence: {
    version: "Glasgow-Blatchford score",
    intendedPopulation: "Adults with suspected upper GI bleeding at presentation.",
    exclusions: [
      "Known variceal bleeding pathways requiring specialist protocols",
      "Children",
    ],
    references: [
      {
        title: "A risk score to predict need for treatment for upper-gastrointestinal haemorrhage",
        citation: "Blatchford O, et al. Lancet. 2000;356(9238):1318–1321.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11073021/",
      },
      {
        title: "Outpatient management of low-risk UGIB",
        citation: "Stanley AJ, et al. Lancet. 2009;373(9657):42–47.",
        url: "https://pubmed.ncbi.nlm.nih.gov/19091393/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "bun",
      label: "BUN / urea nitrogen",
      type: "select",
      options: [
        { label: "< 6.5 mmol/L (<18.2 mg/dL) — 0", value: "0", points: 0 },
        { label: "6.5–7.9 mmol/L — 2", value: "2", points: 2 },
        { label: "8.0–9.9 mmol/L — 3", value: "3", points: 3 },
        { label: "10.0–24.9 mmol/L — 4", value: "4", points: 4 },
        { label: "≥ 25 mmol/L — 6", value: "6", points: 6 },
      ],
    },
    {
      id: "hb_sex",
      label: "Hemoglobin",
      type: "select",
      options: [
        { label: "Male ≥13.0 / Female ≥12.0 g/dL — 0", value: "0", points: 0 },
        { label: "Male 12.0–12.9 / Female 10.0–11.9 — 1", value: "1", points: 1 },
        { label: "Male 10.0–11.9 — 3", value: "3", points: 3 },
        { label: "< 10.0 g/dL (either sex) — 6", value: "6", points: 6 },
      ],
    },
    {
      id: "sbp",
      label: "Systolic BP",
      type: "select",
      options: [
        { label: "≥ 110 mmHg — 0", value: "0", points: 0 },
        { label: "100–109 — 1", value: "1", points: 1 },
        { label: "90–99 — 2", value: "2", points: 2 },
        { label: "< 90 — 3", value: "3", points: 3 },
      ],
    },
    { id: "hr", label: "Heart rate ≥ 100/min (1)", type: "boolean" },
    { id: "melaena", label: "Melaena (1)", type: "boolean" },
    { id: "syncope", label: "Syncope (2)", type: "boolean" },
    { id: "liver", label: "Hepatic disease (2)", type: "boolean" },
    { id: "heart", label: "Cardiac failure (2)", type: "boolean" },
  ],
  calculate: (values) => {
    const score =
      sumSelectPoints(values, [
        { id: "bun", options: blatchford.inputs[0].options },
        { id: "hb_sex", options: blatchford.inputs[1].options },
        { id: "sbp", options: blatchford.inputs[2].options },
      ]) +
      (values.hr ? 1 : 0) +
      (values.melaena ? 1 : 0) +
      (values.syncope ? 2 : 0) +
      (values.liver ? 2 : 0) +
      (values.heart ? 2 : 0);

    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Very low risk band (score 0)";
    if (score >= 6) {
      severity = "severe";
      label = "Higher risk band — intervention more likely";
    } else if (score >= 2) {
      severity = "moderate";
      label = "Intermediate risk band";
    } else if (score === 1) {
      severity = "low";
      label = "Low risk band (non-zero)";
    }

    return scoreResult({
      score,
      maxScore: 23,
      label,
      severity,
      interpretation: `Glasgow-Blatchford score ${score}.`,
      clinicalSignificance:
        "Score 0 identifies a very low-risk group that may be suitable for outpatient management in validated pathways.",
      limitations:
        "Does not replace endoscopy timing decisions in high-risk bleeders. Unit conversions for BUN/urea must be careful.",
      recommendations:
        score === 0
          ? [
              "Consider outpatient pathway only if full clinical assessment agrees and follow-up is reliable.",
              "Provide clear return precautions for rebleeding.",
            ]
          : [
              "Hospital assessment and GI review are commonly required.",
              "Resuscitate, reverse anticoagulants when appropriate, and plan endoscopy timing.",
            ],
    });
  },
};
