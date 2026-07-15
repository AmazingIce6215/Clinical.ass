import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const mentzer: CalculatorDefinition = {
  slug: "mentzer-index",
  title: "Mentzer Index",
  shortName: "Mentzer",
  description:
    "MCV/RBC ratio used as a rough screen distinguishing iron deficiency from beta-thalassemia trait.",
  category: "hematology",
  icon: "flask-conical",
  clinicalApplication:
    "Educational microcytosis work-up adjunct. Not definitive without iron studies/Hb electrophoresis.",
  evidence: {
    version: "Mentzer index = MCV / RBC",
    intendedPopulation: "Patients with microcytic anaemia being differentiated for thalassemia trait vs iron deficiency.",
    exclusions: [
      "Combined deficiencies",
      "Recent transfusion",
      "Children without age-specific interpretation",
    ],
    references: [
      {
        title: "Differentiation of iron deficiency from thalassemia trait",
        citation: "Mentzer WC. Lancet. 1973;1(7808):882.",
        url: "https://pubmed.ncbi.nlm.nih.gov/4123424/",
      },
      {
        title: "Performance of red cell indices in microcytosis",
        citation: "Vehapoglu A, et al. Anemia. 2014.",
        url: "https://pubmed.ncbi.nlm.nih.gov/24818016/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "mcv", label: "MCV", type: "number", suffix: "fL", min: 40, max: 120, step: 0.1 },
    {
      id: "rbc",
      label: "RBC count",
      type: "number",
      suffix: "×10¹²/L",
      min: 1,
      max: 10,
      step: 0.01,
    },
  ],
  calculate: (values) => {
    const mcv = asNumber(values.mcv);
    const rbc = asNumber(values.rbc);
    if (rbc <= 0) throw new Error("RBC must be greater than zero.");
    const value = mcv / rbc;
    let label = "Indeterminate Mentzer band (~13)";
    let severity: "low" | "moderate" = "low";
    if (value > 13) {
      label = "Index > 13 — iron deficiency more likely (classic teaching)";
      severity = "moderate";
    } else if (value < 13) {
      label = "Index < 13 — thalassemia trait more likely (classic teaching)";
      severity = "moderate";
    }
    return formulaResult({
      value,
      digits: 2,
      label,
      severity,
      interpretation: `Mentzer index ${roundTo(value, 2)}.`,
      clinicalSignificance:
        "A rough bedside index only; cut-off of 13 is traditional with imperfect sensitivity/specificity.",
      limitations:
        "Overlapping values are common. Confirm with ferritin and haemoglobinopathy testing.",
      details: [
        { label: "MCV", value: `${mcv}` },
        { label: "RBC", value: `${rbc}` },
        { label: "Mentzer", value: `${roundTo(value, 2)}` },
      ],
      recommendations: [
        "Check iron studies and consider Hb electrophoresis/HPLC when indicated.",
        "Do not start long-term iron without confirming deficiency.",
      ],
    });
  },
};
