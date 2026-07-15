import type { CalculatorDefinition } from "../types";
import { asNumber, scoreResult } from "../helpers";

export const lightsCriteria: CalculatorDefinition = {
  slug: "lights-criteria",
  title: "Light's Criteria (Pleural Fluid)",
  shortName: "Light's",
  description:
    "Classifies pleural effusions as exudate or transudate using fluid and serum chemistry.",
  category: "pulmonology",
  icon: "air-vent",
  clinicalApplication:
    "Initial laboratory classification of pleural fluid after diagnostic thoracentesis.",
  evidence: {
    version: "Light's criteria (any one positive = exudate)",
    intendedPopulation: "Adults with pleural effusion undergoing diagnostic sampling.",
    exclusions: [
      "Patients on diuretics may misclassify some transudates as exudates",
      "Empyema/frank pus — treat as infected without relying on criteria alone",
    ],
    references: [
      {
        title: "Pleural effusions: the diagnostic separation of transudates and exudates",
        citation: "Light RW, et al. Ann Intern Med. 1972;77(4):507–513.",
        url: "https://pubmed.ncbi.nlm.nih.gov/4642731/",
      },
      {
        title: "BTS pleural disease guideline context",
        citation: "British Thoracic Society pleural disease guidelines.",
        url: "https://www.brit-thoracic.org.uk/quality-improvement/guidelines/pleural-disease/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "fluid_protein", label: "Pleural fluid protein", type: "number", suffix: "g/L or g/dL (match serum)", min: 0, max: 100, step: 0.1 },
    { id: "serum_protein", label: "Serum protein", type: "number", suffix: "same unit", min: 1, max: 120, step: 0.1 },
    { id: "fluid_ldh", label: "Pleural fluid LDH", type: "number", suffix: "U/L", min: 0, max: 10000, step: 1 },
    { id: "serum_ldh", label: "Serum LDH", type: "number", suffix: "U/L", min: 1, max: 10000, step: 1 },
    {
      id: "ldh_uln",
      label: "Serum LDH upper limit of normal",
      type: "number",
      suffix: "U/L",
      min: 100,
      max: 500,
      step: 1,
      helpText: "Used for fluid LDH > 2/3 ULN criterion.",
    },
  ],
  calculate: (values) => {
    const fp = asNumber(values.fluid_protein);
    const sp = asNumber(values.serum_protein);
    const fl = asNumber(values.fluid_ldh);
    const sl = asNumber(values.serum_ldh);
    const uln = asNumber(values.ldh_uln);
    if (sp <= 0 || sl <= 0 || uln <= 0) throw new Error("Serum protein, serum LDH, and ULN must be > 0.");
    const proteinRatio = fp / sp;
    const ldhRatio = fl / sl;
    const ldhTwoThirds = fl > (2 / 3) * uln;
    const c1 = proteinRatio > 0.5;
    const c2 = ldhRatio > 0.6;
    const c3 = ldhTwoThirds;
    const positives = [c1, c2, c3].filter(Boolean).length;
    const exudate = positives > 0;
    return scoreResult({
      score: positives,
      maxScore: 3,
      label: exudate ? "Exudate by Light's criteria" : "Transudate by Light's criteria",
      severity: exudate ? "moderate" : "low",
      interpretation: exudate
        ? `Exudate (${positives}/3 criteria met).`
        : "No Light's exudate criteria met — classifies as transudate.",
      clinicalSignificance:
        "Exudates prompt investigation for infection, malignancy, PE, and inflammatory causes; transudates suggest heart failure, cirrhosis, or nephrosis.",
      limitations:
        "Diuretic therapy can elevate protein/LDH ratios in cardiac effusions. Clinical context remains essential.",
      details: [
        { label: "Protein ratio", value: proteinRatio.toFixed(2) },
        { label: "LDH ratio", value: ldhRatio.toFixed(2) },
        { label: "Fluid LDH > 2/3 ULN", value: c3 ? "Yes" : "No" },
      ],
      recommendations: exudate
        ? [
            "Send fluid for cell count, Gram stain/culture, cytology as indicated.",
            "Correlate with imaging and risk factors for PE/malignancy.",
          ]
        : [
            "Treat underlying cause of transudate (e.g. heart failure).",
            "Reconsider sampling quality if clinical picture suggests exudate.",
          ],
    });
  },
};
