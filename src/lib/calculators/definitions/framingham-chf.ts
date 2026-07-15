import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const framinghamChf: CalculatorDefinition = {
  slug: "framingham-chf",
  title: "Framingham Heart Failure Criteria",
  shortName: "Framingham HF",
  description:
    "Clinical criteria for congestive heart failure diagnosis using major and minor features.",
  category: "cardiology",
  icon: "heart-pulse",
  clinicalApplication:
    "Educational diagnostic checklist. Modern diagnosis integrates natriuretic peptides and imaging.",
  evidence: {
    version: "Framingham HF criteria (2 major, or 1 major + 2 minor)",
    intendedPopulation: "Adults evaluated for clinical heart failure.",
    exclusions: [
      "Replacement for echocardiography and natriuretic peptide testing",
      "Acute shock without full assessment",
    ],
    references: [
      {
        title: "The natural history of congestive heart failure: the Framingham study",
        citation: "McKee PA, et al. N Engl J Med. 1971;285(26):1441–1446.",
        url: "https://pubmed.ncbi.nlm.nih.gov/5122894/",
      },
      {
        title: "ESC heart failure diagnostic approach",
        citation: "McDonagh TA, et al. Eur Heart J. 2021.",
        url: "https://pubmed.ncbi.nlm.nih.gov/34447992/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "pnd", label: "Major: Paroxysmal nocturnal dyspnea", type: "boolean" },
    { id: "neck_veins", label: "Major: Neck vein distension", type: "boolean" },
    { id: "rales", label: "Major: Rales", type: "boolean" },
    { id: "cardiomegaly", label: "Major: Radiographic cardiomegaly", type: "boolean" },
    { id: "edema_pulmonary", label: "Major: Acute pulmonary edema", type: "boolean" },
    { id: "s3", label: "Major: S3 gallop", type: "boolean" },
    { id: "jvp_hepato", label: "Major: Increased venous pressure >16 cm H2O / hepatojugular reflux", type: "boolean" },
    { id: "weight_loss", label: "Major: Weight loss ≥4.5 kg in 5 days with treatment", type: "boolean" },
    { id: "ankle", label: "Minor: Bilateral ankle edema", type: "boolean" },
    { id: "nocturnal_cough", label: "Minor: Nocturnal cough", type: "boolean" },
    { id: "doe", label: "Minor: Dyspnea on ordinary exertion", type: "boolean" },
    { id: "hepatomegaly", label: "Minor: Hepatomegaly", type: "boolean" },
    { id: "pleural", label: "Minor: Pleural effusion", type: "boolean" },
    { id: "hr_120", label: "Minor: Tachycardia ≥120/min", type: "boolean" },
    { id: "vc", label: "Minor: Decrease in vital capacity by 1/3 from max", type: "boolean" },
  ],
  calculate: (values) => {
    const major = sumBooleanFields(values, [
      "pnd",
      "neck_veins",
      "rales",
      "cardiomegaly",
      "edema_pulmonary",
      "s3",
      "jvp_hepato",
      "weight_loss",
    ]);
    const minor = sumBooleanFields(values, [
      "ankle",
      "nocturnal_cough",
      "doe",
      "hepatomegaly",
      "pleural",
      "hr_120",
      "vc",
    ]);
    const definite = major >= 2 || (major >= 1 && minor >= 2);
    return scoreResult({
      score: major * 2 + minor,
      maxScore: 23,
      label: definite
        ? "Criteria met for Framingham HF"
        : "Criteria not met for Framingham HF",
      severity: definite ? "high" : "low",
      interpretation: `Major ${major}, minor ${minor} — ${definite ? "HF criteria positive" : "HF criteria negative"}.`,
      clinicalSignificance:
        "Historically defined clinical HF in epidemiology; still useful as a structured bedside checklist.",
      limitations:
        "Lower specificity in multimorbidity. BNP/NT-proBNP and echo are central today.",
      details: [
        { label: "Major", value: String(major) },
        { label: "Minor", value: String(minor) },
      ],
      recommendations: definite
        ? [
            "Obtain natriuretic peptides and echocardiography if not already done.",
            "Start guideline-directed evaluation for cause and precipitant.",
          ]
        : [
            "Consider alternative causes of dyspnea/edema.",
            "Reassess if new major features develop.",
          ],
    });
  },
};
