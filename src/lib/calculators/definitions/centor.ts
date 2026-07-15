import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const centor: CalculatorDefinition = {
  slug: "centor",
  title: "Centor Score (Modified) for Strep Pharyngitis",
  shortName: "Centor",
  description:
    "Estimates likelihood of group A streptococcal pharyngitis to guide testing and treatment discussions.",
  category: "infectious-disease",
  icon: "thermometer",
  clinicalApplication:
    "Supports decisions about throat swabbing and empiric therapy in primary/urgent care teaching—follow local antimicrobial policy.",
  evidence: {
    version: "McIsaac modified Centor criteria (includes age)",
    intendedPopulation: "Patients with acute pharyngitis without clear viral features dominating.",
    exclusions: [
      "Immunocompromised hosts needing individualised work-up",
      "Scarlet fever or invasive disease presentations",
      "Children under settings where different guidelines apply",
    ],
    references: [
      {
        title: "The diagnosis of strep throat in adults in the emergency room",
        citation: "Centor RM, et al. Med Decis Making. 1981;1(3):239–246.",
        url: "https://pubmed.ncbi.nlm.nih.gov/6763125/",
      },
      {
        title: "Empirical validation of guidelines for the management of pharyngitis in children and adults",
        citation: "McIsaac WJ, et al. JAMA. 2004;291(13):1587–1595.",
        url: "https://pubmed.ncbi.nlm.nih.gov/15069046/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "fever", label: "History of fever or measured temperature ≥ 38°C", type: "boolean" },
    { id: "nodes", label: "Tender anterior cervical lymphadenopathy", type: "boolean" },
    { id: "exudate", label: "Tonsillar exudate or swelling", type: "boolean" },
    { id: "cough", label: "Absence of cough", type: "boolean" },
    {
      id: "age_band",
      label: "Age band",
      type: "select",
      options: [
        { label: "3–14 years (+1)", value: "1", points: 1 },
        { label: "15–44 years (0)", value: "0", points: 0 },
        { label: "≥ 45 years (−1)", value: "-1", points: -1 },
      ],
    },
  ],
  calculate: (values) => {
    const base = sumBooleanFields(values, ["fever", "nodes", "exudate", "cough"]);
    const agePts = Number(values.age_band) || 0;
    const score = base + agePts;
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Lower streptococcal likelihood band";
    if (score >= 4) {
      severity = "high";
      label = "Higher streptococcal likelihood band";
    } else if (score >= 2) {
      severity = "moderate";
      label = "Intermediate likelihood — testing often considered";
    }

    return scoreResult({
      score,
      maxScore: 5,
      label,
      severity,
      interpretation: `Modified Centor score ${score}.`,
      clinicalSignificance:
        "Higher scores increase pre-test probability of GAS; many guidelines use thresholds for testing rather than automatic antibiotics.",
      limitations:
        "Cannot distinguish carriage from infection. Viral syndromes remain common even at intermediate scores.",
      recommendations:
        score <= 1
          ? ["Symptomatic care is often appropriate; routine antibiotics are usually unnecessary.", "Safety-net for worsening odynophagia, drooling, or neck swelling."]
          : score <= 3
            ? ["Consider rapid antigen/culture testing per local guidance.", "Avoid routine empiric antibiotics without testing when services allow."]
            : ["Testing and/or treatment decisions should follow local antimicrobial policy.", "Assess for peritonsillar complications."],
    });
  },
};
