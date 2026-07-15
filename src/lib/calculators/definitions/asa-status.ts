import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const asaStatus: CalculatorDefinition = {
  slug: "asa-physical-status",
  title: "ASA Physical Status Classification",
  shortName: "ASA-PS",
  description:
    "American Society of Anesthesiologists physical status classification for perioperative risk communication.",
  category: "surgery",
  icon: "hospital",
  clinicalApplication:
    "Standardises description of preoperative comorbidity. Not a standalone operative risk calculator.",
  evidence: {
    version: "ASA Physical Status (current educational mapping I–VI ± E)",
    intendedPopulation: "Patients undergoing anaesthesia/procedural risk discussion.",
    exclusions: [
      "Use as the only perioperative risk tool",
      "Assignment without clinical context of functional status",
    ],
    references: [
      {
        title: "ASA Physical Status Classification System",
        citation: "American Society of Anesthesiologists. ASA House of Delegates / educational statement.",
        url: "https://www.asahq.org/standards-and-practice-parameters/statement-on-asa-physical-status-classification-system",
      },
      {
        title: "ASA class is a reliable independent predictor of medical complications and mortality following surgery",
        citation: "Hackett NJ, et al. Int J Surg. 2015;18:184–190.",
        url: "https://pubmed.ncbi.nlm.nih.gov/25937154/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "asa",
      label: "ASA class",
      type: "select",
      options: [
        { label: "I — Healthy patient", value: "1", points: 1 },
        { label: "II — Mild systemic disease", value: "2", points: 2 },
        { label: "III — Severe systemic disease", value: "3", points: 3 },
        { label: "IV — Severe systemic disease, constant threat to life", value: "4", points: 4 },
        { label: "V — Moribund, not expected to survive without operation", value: "5", points: 5 },
        { label: "VI — Declared brain-dead organ donor", value: "6", points: 6 },
      ],
    },
    { id: "emergency", label: "Emergency surgery modifier (E)", type: "boolean" },
  ],
  calculate: (values) => {
    const score = Number(values.asa) || 1;
    const emergency = Boolean(values.emergency);
    const labels: Record<number, string> = {
      1: "ASA I",
      2: "ASA II",
      3: "ASA III",
      4: "ASA IV",
      5: "ASA V",
      6: "ASA VI",
    };
    const severity =
      score <= 2 ? "low" : score === 3 ? "moderate" : score === 4 ? "high" : "critical";
    return scoreResult({
      score,
      maxScore: 6,
      label: `${labels[score]}${emergency ? "E" : ""}`,
      severity,
      interpretation: `${labels[score]}${emergency ? "E (emergency)" : ""} physical status.`,
      clinicalSignificance:
        "Higher ASA classes associate with increased perioperative morbidity/mortality but assignment is subjective.",
      limitations:
        "Inter-rater variability is well described. Combine with procedure risk and functional capacity.",
      recommendations: [
        "Document examples justifying the assigned class.",
        "Use alongside RCRI/NSQIP-style tools when detailed cardiac risk is needed.",
      ],
    });
  },
};
