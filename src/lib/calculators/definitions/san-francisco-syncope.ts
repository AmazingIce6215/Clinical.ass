import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const sanFranciscoSyncope: CalculatorDefinition = {
  slug: "san-francisco-syncope",
  title: "San Francisco Syncope Rule",
  shortName: "SFSR",
  description:
    "Five-item rule to identify syncope patients at higher risk of short-term serious outcomes.",
  category: "emergency",
  icon: "activity",
  clinicalApplication:
    "ED risk prompts after syncope. Not a standalone discharge tool.",
  evidence: {
    version: "San Francisco Syncope Rule (CHESS)",
    intendedPopulation: "Adults presenting to ED with syncope or near-syncope.",
    exclusions: [
      "Seizure, stroke, head trauma as primary events",
      "Persistent altered mental status",
    ],
    references: [
      {
        title: "Derivation of the San Francisco Syncope Rule",
        citation: "Quinn JV, et al. Ann Emerg Med. 2004;43(2):224–232.",
        url: "https://pubmed.ncbi.nlm.nih.gov/14747812/",
      },
      {
        title: "Validation of the San Francisco Syncope Rule",
        citation: "Quinn J, et al. Ann Emerg Med. 2006;47(5):448–454.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16631985/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "chf", label: "History of congestive heart failure", type: "boolean" },
    { id: "hct", label: "Hematocrit < 30%", type: "boolean" },
    { id: "ecg", label: "Abnormal ECG", type: "boolean" },
    { id: "sob", label: "Shortness of breath", type: "boolean" },
    { id: "sbp", label: "Triage SBP < 90 mmHg", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, ["chf", "hct", "ecg", "sob", "sbp"]);
    const positive = score > 0;
    return scoreResult({
      score,
      maxScore: 5,
      label: positive
        ? "SFSR positive — higher risk of serious outcome"
        : "SFSR negative — lower risk band (if rule applies)",
      severity: positive ? "high" : "low",
      interpretation: positive
        ? `${score} CHESS feature(s) present.`
        : "No San Francisco Syncope Rule features present.",
      clinicalSignificance:
        "Any positive feature identifies patients who may need admission/further evaluation for arrhythmia, PE, bleed, or cardiopulmonary events.",
      limitations:
        "External validation mixed; Canadian Syncope Risk Score is an alternative. Clinical judgment remains essential.",
      recommendations: positive
        ? [
            "Consider monitoring, labs, ECG review, and specialist input.",
            "Do not discharge solely on a negative gestalt if features are present.",
          ]
        : [
            "May support discharge planning only when full assessment is reassuring.",
            "Provide clear return precautions for recurrent syncope or chest pain.",
          ],
    });
  },
};
