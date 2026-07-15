import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const rass: CalculatorDefinition = {
  slug: "rass",
  title: "Richmond Agitation-Sedation Scale (RASS)",
  shortName: "RASS",
  description:
    "10-point scale from +4 (combative) to −5 (unarousable) for agitation and sedation assessment.",
  category: "critical-care",
  icon: "hospital",
  clinicalApplication:
    "Targets sedation goals in ventilated patients and screens for CAM-ICU eligibility.",
  evidence: {
    version: "RASS (Sessler / Ely)",
    intendedPopulation: "Critically ill adults, especially mechanically ventilated patients.",
    exclusions: [
      "Use without a defined sedation target",
      "Children without paediatric scales",
    ],
    references: [
      {
        title: "The Richmond Agitation-Sedation Scale",
        citation: "Sessler CN, et al. Am J Respir Crit Care Med. 2002;166(10):1338–1344.",
        url: "https://pubmed.ncbi.nlm.nih.gov/12421743/",
      },
      {
        title: "Monitoring sedation status over time in ICU patients: reliability and validity of RASS",
        citation: "Ely EW, et al. JAMA. 2003;289(22):2983–2991.",
        url: "https://pubmed.ncbi.nlm.nih.gov/12799407/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "rass",
      label: "RASS level",
      type: "select",
      options: [
        { label: "+4 Combative", value: "4", points: 4 },
        { label: "+3 Very agitated", value: "3", points: 3 },
        { label: "+2 Agitated", value: "2", points: 2 },
        { label: "+1 Restless", value: "1", points: 1 },
        { label: "0 Alert and calm", value: "0", points: 0 },
        { label: "−1 Drowsy", value: "-1", points: -1 },
        { label: "−2 Light sedation", value: "-2", points: -2 },
        { label: "−3 Moderate sedation", value: "-3", points: -3 },
        { label: "−4 Deep sedation", value: "-4", points: -4 },
        { label: "−5 Unarousable", value: "-5", points: -5 },
      ],
    },
  ],
  calculate: (values) => {
    const score = Number(values.rass);
    let severity: "low" | "moderate" | "high" | "critical" = "low";
    let label = "Alert and calm / light target band";
    if (score >= 2) {
      severity = "high";
      label = "Agitation band — safety and titration review";
    } else if (score <= -4) {
      severity = "critical";
      label = "Deep sedation / unarousable band";
    } else if (score === -3 || score === 1) {
      severity = "moderate";
      label = "Mild deviation from common 0 to −2 targets";
    } else if (score === 0 || score === -1 || score === -2) {
      severity = "low";
      label = "Common light-sedation target band";
    }

    return scoreResult({
      score,
      maxScore: 4,
      label,
      severity,
      interpretation: `RASS ${score >= 0 ? `+${score}` : score}.`,
      clinicalSignificance:
        "Many ICU protocols target light sedation (RASS 0 to −2) unless deeper sedation is specifically indicated.",
      limitations:
        "Does not diagnose delirium (use CAM-ICU). Pain, hypoxia, and withdrawal also cause agitation.",
      details: [{ label: "RASS", value: String(score) }],
      recommendations:
        score >= 2
          ? ["Assess pain, delirium, hypoxia, and safety; titrate sedation/analgesia per protocol.", "Consider non-pharmacological de-escalation first when safe."]
          : score <= -3
            ? ["Review whether deep sedation is intentional; lighten if goals allow.", "CAM-ICU cannot be assessed if RASS ≤ −4."]
            : ["Maintain target sedation and reassess regularly.", "Pair with pain and delirium screening."],
    });
  },
};
