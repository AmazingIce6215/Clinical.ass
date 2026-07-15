import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const stopBang: CalculatorDefinition = {
  slug: "stop-bang",
  title: "STOP-BANG Score for Obstructive Sleep Apnea",
  shortName: "STOP-BANG",
  description:
    "Eight-item screening questionnaire for obstructive sleep apnea risk.",
  category: "pulmonology",
  icon: "air-vent",
  clinicalApplication:
    "Preoperative and primary-care OSA screening education. Positive screens need confirmatory testing pathways.",
  evidence: {
    version: "STOP-Bang questionnaire",
    intendedPopulation: "Adults screened for OSA risk (clinic or preoperative).",
    exclusions: [
      "Children",
      "Replacement for polysomnography or home sleep apnea testing",
    ],
    references: [
      {
        title: "STOP questionnaire: a tool to screen patients for obstructive sleep apnea",
        citation: "Chung F, et al. Anesthesiology. 2008;108(5):812–821.",
        url: "https://pubmed.ncbi.nlm.nih.gov/18431116/",
      },
      {
        title: "STOP-Bang and high-risk OSA",
        citation: "Chung F, et al. Br J Anaesth. 2012;108(5):768–775.",
        url: "https://pubmed.ncbi.nlm.nih.gov/22401881/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "snore", label: "Snoring loudly", type: "boolean" },
    { id: "tired", label: "Tired, fatigued, or sleepy during daytime", type: "boolean" },
    { id: "observed", label: "Observed stopped breathing / choking / gasping", type: "boolean" },
    { id: "pressure", label: "Hypertension (treated or untreated)", type: "boolean" },
    { id: "bmi", label: "BMI > 35 kg/m²", type: "boolean" },
    { id: "age", label: "Age > 50 years", type: "boolean" },
    { id: "neck", label: "Neck circumference large (>40 cm / shirt collar ≥17\" M or ≥16\" F)", type: "boolean" },
    { id: "gender", label: "Male sex", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, [
      "snore",
      "tired",
      "observed",
      "pressure",
      "bmi",
      "age",
      "neck",
      "gender",
    ]);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Lower OSA risk band (0–2)";
    if (score >= 5) {
      severity = "high";
      label = "Higher OSA risk band (5–8)";
    } else if (score >= 3) {
      severity = "moderate";
      label = "Intermediate OSA risk band (3–4)";
    }
    return scoreResult({
      score,
      maxScore: 8,
      label,
      severity,
      interpretation: `STOP-BANG ${score}/8.`,
      clinicalSignificance:
        "Higher scores increase likelihood of moderate–severe OSA in validation cohorts, especially perioperatively.",
      limitations:
        "Screening tool with imperfect specificity. Does not grade AHI or treatment need.",
      recommendations:
        score >= 3
          ? [
              "Consider sleep study referral and perioperative risk mitigation.",
              "Advise caution with sedatives/opioids when OSA is likely.",
            ]
          : [
              "Routine OSA testing may be lower yield unless symptoms are compelling.",
              "Reassess if weight, symptoms, or comorbidities change.",
            ],
    });
  },
};
