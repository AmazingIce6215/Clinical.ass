import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const cage: CalculatorDefinition = {
  slug: "cage",
  title: "CAGE Questionnaire",
  shortName: "CAGE",
  description:
    "Four-question screening tool for possible alcohol use disorder.",
  category: "mental-health",
  icon: "pill",
  clinicalApplication:
    "Brief bedside alcohol screening. Positive screens need fuller assessment.",
  evidence: {
    version: "CAGE (Ewing)",
    intendedPopulation: "Adults in primary/hospital care alcohol screening.",
    exclusions: [
      "Replacement for full diagnostic interview",
      "Acute withdrawal management",
    ],
    references: [
      {
        title: "Detecting alcoholism: the CAGE questionnaire",
        citation: "Ewing JA. JAMA. 1984;252(14):1905–1907.",
        url: "https://pubmed.ncbi.nlm.nih.gov/6471323/",
      },
      {
        title: "CAGE performance reviews",
        citation: "Dhalla S, Kopec JA. Clin Invest Med. 2007;30(1):33–41.",
        url: "https://pubmed.ncbi.nlm.nih.gov/17716538/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "cut", label: "Cut down — felt you should cut down on drinking?", type: "boolean" },
    { id: "annoyed", label: "Annoyed — people criticising your drinking?", type: "boolean" },
    { id: "guilty", label: "Guilty — felt bad or guilty about drinking?", type: "boolean" },
    { id: "eye", label: "Eye-opener — drink first thing in the morning?", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, ["cut", "annoyed", "guilty", "eye"]);
    const positive = score >= 2;
    return scoreResult({
      score,
      maxScore: 4,
      label: positive ? "Positive CAGE screen (≥2)" : "Negative CAGE screen",
      severity: positive ? (score >= 3 ? "high" : "moderate") : "low",
      interpretation: `CAGE ${score}/4.`,
      clinicalSignificance:
        "≥2 affirmative answers suggests possible alcohol use disorder and warrants further evaluation.",
      limitations:
        "Less sensitive for hazardous drinking without dependence. Cultural factors influence answers.",
      recommendations: positive
        ? [
            "Take a full alcohol history and consider AUDIT.",
            "Assess withdrawal risk and offer brief intervention/referral.",
          ]
        : [
            "Continue routine preventive counselling as indicated.",
            "Reassess if clinical suspicion remains high despite a negative screen.",
          ],
    });
  },
};
