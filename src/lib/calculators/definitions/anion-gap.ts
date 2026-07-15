import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const anionGap: CalculatorDefinition = {
  slug: "anion-gap",
  title: "Anion Gap",
  shortName: "AG",
  description: "Calculates the serum anion gap for acid–base interpretation.",
  category: "nephrology",
  icon: "flask-conical",
  clinicalApplication:
    "Supports classification of metabolic acidosis and detection of unmeasured anions in educational cases.",
  evidence: {
    version: "AG = Na − (Cl + HCO₃); optional K included variant not used here",
    intendedPopulation: "Adults with contemporaneous electrolytes for acid–base teaching.",
    exclusions: [
      "Severe hypoalbuminaemia without albumin correction when clinically relevant",
      "Lab methods with different normal ranges—use local reference intervals",
    ],
    references: [
      {
        title: "Serum anion gap: its uses and limitations in clinical medicine",
        citation: "Kraut JA, Madias NE. Clin J Am Soc Nephrol. 2007;2(1):162–174.",
        url: "https://pubmed.ncbi.nlm.nih.gov/17699401/",
      },
      {
        title: "Clinical use of the anion gap",
        citation: "Emmett M, Narins RG. Medicine (Baltimore). 1977;56(1):38–54.",
        url: "https://pubmed.ncbi.nlm.nih.gov/834136/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "na", label: "Sodium", type: "number", suffix: "mmol/L", min: 100, max: 180, step: 0.1 },
    { id: "cl", label: "Chloride", type: "number", suffix: "mmol/L", min: 70, max: 140, step: 0.1 },
    { id: "hco3", label: "Bicarbonate / total CO₂", type: "number", suffix: "mmol/L", min: 2, max: 50, step: 0.1 },
  ],
  calculate: (values) => {
    const na = asNumber(values.na);
    const cl = asNumber(values.cl);
    const hco3 = asNumber(values.hco3);
    const ag = na - (cl + hco3);

    let severity: "low" | "moderate" | "high" = "low";
    let label = "Anion gap within a common reference band";
    if (ag > 16) {
      severity = "high";
      label = "Elevated anion gap";
    } else if (ag < 6) {
      severity = "moderate";
      label = "Low anion gap";
    }

    return formulaResult({
      value: ag,
      unit: "mmol/L",
      digits: 1,
      label,
      severity,
      interpretation: `Anion gap ${roundTo(ag, 1)} mmol/L (Na ${na} − Cl ${cl} − HCO₃ ${hco3}).`,
      clinicalSignificance:
        "An elevated gap prompts consideration of lactic acidosis, ketoacidosis, toxins, and renal failure among other causes. Local lab normals vary (often ~8–12 or up to ~16 with modern assays).",
      limitations:
        "Does not replace full acid–base analysis (pH, pCO₂, delta gap, osmolar gap). Albumin affects the expected gap.",
      details: [
        { label: "Na", value: `${na}` },
        { label: "Cl", value: `${cl}` },
        { label: "HCO₃", value: `${hco3}` },
        { label: "Anion gap", value: `${roundTo(ag, 1)}` },
      ],
      recommendations: [
        "Interpret with arterial/venous blood gas and clinical context.",
        "Consider albumin-corrected gap when hypoalbuminaemia is present.",
      ],
    });
  },
};
