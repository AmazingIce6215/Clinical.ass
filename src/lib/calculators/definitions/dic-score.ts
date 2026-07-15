import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const dicScore: CalculatorDefinition = {
  slug: "dic-score",
  title: "ISTH DIC Score",
  shortName: "DIC",
  description:
    "Overt disseminated intravascular coagulation score using platelets, fibrin markers, PT, and fibrinogen.",
  category: "hematology",
  icon: "droplets",
  clinicalApplication:
    "Supports diagnosis of overt DIC in a compatible clinical context (sepsis, trauma, malignancy, obstetric catastrophe).",
  evidence: {
    version: "ISTH overt DIC score",
    intendedPopulation: "Patients with an underlying condition associated with DIC.",
    exclusions: [
      "Use without a compatible DIC-associated diagnosis",
      "Chronic compensated DIC may score differently",
    ],
    references: [
      {
        title: "Towards definition, clinical and laboratory criteria, and a scoring system for DIC",
        citation: "Taylor FB Jr, et al. Thromb Haemost. 2001;86(5):1327–1330.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11816725/",
      },
      {
        title: "ISTH guidance on DIC diagnosis",
        citation: "Wada H, et al. J Thromb Haemost. 2013.",
        url: "https://pubmed.ncbi.nlm.nih.gov/23379279/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "plt",
      label: "Platelet count",
      type: "select",
      options: [
        { label: "> 100 ×10⁹/L (0)", value: "0", points: 0 },
        { label: "50–100 (1)", value: "1", points: 1 },
        { label: "< 50 (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "fibrin",
      label: "Elevated fibrin marker (D-dimer/FDP)",
      type: "select",
      options: [
        { label: "No increase (0)", value: "0", points: 0 },
        { label: "Moderate increase (2)", value: "2", points: 2 },
        { label: "Strong increase (3)", value: "3", points: 3 },
      ],
    },
    {
      id: "pt",
      label: "Prolonged PT",
      type: "select",
      options: [
        { label: "< 3 s prolongation (0)", value: "0", points: 0 },
        { label: "3–6 s (1)", value: "1", points: 1 },
        { label: "> 6 s (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "fibrinogen",
      label: "Fibrinogen",
      type: "select",
      options: [
        { label: "> 1.0 g/L (0)", value: "0", points: 0 },
        { label: "≤ 1.0 g/L (1)", value: "1", points: 1 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, dicScore.inputs);
    const overt = score >= 5;
    return scoreResult({
      score,
      maxScore: 8,
      label: overt ? "Compatible with overt DIC (≥5)" : "Not overt DIC by ISTH score (<5)",
      severity: overt ? "high" : score >= 3 ? "moderate" : "low",
      interpretation: `ISTH DIC score ${score}/8.`,
      clinicalSignificance:
        "Score ≥5 in a compatible setting supports overt DIC and prompts treatment of the underlying cause plus supportive care.",
      limitations:
        "Requires clinical context. Non-overt DIC scoring systems exist separately.",
      recommendations: overt
        ? [
            "Treat underlying driver (sepsis source control, obstetric emergency, etc.).",
            "Supportive transfusion guided by bleeding and labs; involve haematology.",
          ]
        : [
            "Repeat scoring if the clinical picture evolves.",
            "Investigate alternative coagulopathies.",
          ],
    });
  },
};
