import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const mascc: CalculatorDefinition = {
  slug: "mascc",
  title: "MASCC Febrile Neutropenia Risk",
  shortName: "MASCC",
  description:
    "Identifies low-risk febrile neutropenia patients who may be candidates for outpatient therapy.",
  category: "infectious-disease",
  icon: "thermometer",
  clinicalApplication:
    "Risk stratification after fever in neutropenia. High-risk features still require inpatient care.",
  evidence: {
    version: "MASCC risk index",
    intendedPopulation: "Adults with febrile neutropenia from cancer therapy.",
    exclusions: [
      "Children without paediatric tools",
      "Unstable patients regardless of score",
    ],
    references: [
      {
        title: "The Multinational Association for Supportive Care in Cancer risk index",
        citation: "Klastersky J, et al. J Clin Oncol. 2000;18(16):3038–3051.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10944139/",
      },
      {
        title: "IDSA febrile neutropenia guidelines",
        citation: "Freifeld AG, et al. Clin Infect Dis. 2011;52(4):e56–e93.",
        url: "https://pubmed.ncbi.nlm.nih.gov/21258094/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "burden",
      label: "Burden of illness",
      type: "select",
      options: [
        { label: "No or mild symptoms (5)", value: "5", points: 5 },
        { label: "Moderate symptoms (3)", value: "3", points: 3 },
        { label: "Severe symptoms / moribund (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "hypotension",
      label: "Hypotension (SBP < 90)",
      type: "select",
      options: [
        { label: "No hypotension (5)", value: "5", points: 5 },
        { label: "Hypotension present (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "copd",
      label: "Active COPD",
      type: "select",
      options: [
        { label: "No COPD (4)", value: "4", points: 4 },
        { label: "COPD present (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "solid_or_no_fungal",
      label: "Solid tumour or haematologic malignancy with no previous fungal infection",
      type: "select",
      options: [
        { label: "Yes (4)", value: "4", points: 4 },
        { label: "No (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "dehydration",
      label: "Dehydration requiring IV fluids",
      type: "select",
      options: [
        { label: "No (3)", value: "3", points: 3 },
        { label: "Yes (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "outpatient",
      label: "Outpatient status at fever onset",
      type: "select",
      options: [
        { label: "Outpatient (3)", value: "3", points: 3 },
        { label: "Inpatient (0)", value: "0", points: 0 },
      ],
    },
    {
      id: "age",
      label: "Age",
      type: "select",
      options: [
        { label: "< 60 years (2)", value: "2", points: 2 },
        { label: "≥ 60 years (0)", value: "0", points: 0 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, mascc.inputs);
    const lowRisk = score >= 21;
    return scoreResult({
      score,
      maxScore: 26,
      label: lowRisk
        ? "Low-risk MASCC band (≥21)"
        : "Higher-risk MASCC band (<21)",
      severity: lowRisk ? "low" : "high",
      interpretation: `MASCC ${score} — ${lowRisk ? "low risk" : "not low risk"}.`,
      clinicalSignificance:
        "Scores ≥21 identify candidates who may be suitable for oral/outpatient regimens if social support and logistics allow.",
      limitations:
        "Clinical instability overrides score. CISNE is an alternative tool in solid tumours.",
      recommendations: lowRisk
        ? [
            "Consider outpatient oral therapy only if local criteria and follow-up are met.",
            "Ensure prompt return pathway for deterioration.",
          ]
        : [
            "Inpatient IV antibiotics and monitoring are typically required.",
            "Investigate source and escalate for sepsis features.",
          ],
    });
  },
};
