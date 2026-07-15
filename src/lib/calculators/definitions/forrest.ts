import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const forrest: CalculatorDefinition = {
  slug: "forrest-classification",
  title: "Forrest Classification (Ulcer Bleed)",
  shortName: "Forrest",
  description:
    "Endoscopic classification of peptic ulcer haemorrhage risk and rebleeding.",
  category: "gastroenterology",
  icon: "droplets",
  clinicalApplication:
    "Describes ulcer stigmata to guide endoscopic therapy and post-procedure care.",
  evidence: {
    version: "Forrest I–III classification",
    intendedPopulation: "Patients with peptic ulcer bleeding at endoscopy.",
    exclusions: [
      "Non-ulcer upper GI bleeding sources",
      "Use without endoscopic visualisation",
    ],
    references: [
      {
        title: "Endoscopy in gastrointestinal bleeding",
        citation: "Forrest JA, Finlayson ND, Shearman DJ. Lancet. 1974;2(7877):394–397.",
        url: "https://pubmed.ncbi.nlm.nih.gov/4136718/",
      },
      {
        title: "International consensus on nonvariceal UGIB",
        citation: "Barkun AN, et al. Ann Intern Med. 2019.",
        url: "https://pubmed.ncbi.nlm.nih.gov/31634917/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "class",
      label: "Forrest class",
      type: "select",
      options: [
        { label: "Ia — Spurting haemorrhage", value: "1a", points: 6 },
        { label: "Ib — Oozing haemorrhage", value: "1b", points: 5 },
        { label: "IIa — Non-bleeding visible vessel", value: "2a", points: 4 },
        { label: "IIb — Adherent clot", value: "2b", points: 3 },
        { label: "IIc — Flat pigmented spot", value: "2c", points: 2 },
        { label: "III — Clean base ulcer", value: "3", points: 1 },
      ],
    },
  ],
  calculate: (values) => {
    const map: Record<string, { label: string; severity: "low" | "moderate" | "high" | "critical"; score: number }> = {
      "1a": { label: "Forrest Ia — active spurting (highest rebleed risk)", severity: "critical", score: 6 },
      "1b": { label: "Forrest Ib — active oozing", severity: "high", score: 5 },
      "2a": { label: "Forrest IIa — non-bleeding visible vessel", severity: "high", score: 4 },
      "2b": { label: "Forrest IIb — adherent clot", severity: "moderate", score: 3 },
      "2c": { label: "Forrest IIc — flat pigmented spot", severity: "low", score: 2 },
      "3": { label: "Forrest III — clean base", severity: "low", score: 1 },
    };
    const key = String(values.class);
    const result = map[key] ?? map["3"];
    return scoreResult({
      score: result.score,
      maxScore: 6,
      label: result.label,
      severity: result.severity,
      interpretation: result.label,
      clinicalSignificance:
        "Ia–IIa lesions typically receive endoscopic haemostasis; IIc–III often managed medically with lower rebleed risk.",
      limitations:
        "Classification is endoscopic and operator-dependent. Clot (IIb) management strategies vary.",
      recommendations:
        result.score >= 4
          ? [
              "Endoscopic therapy indicated; high-dose PPI and inpatient monitoring.",
              "Discuss rebleeding plan and second-look thresholds.",
            ]
          : [
              "Medical therapy and early diet as appropriate.",
              "Test/treat H. pylori and address NSAID/anticoagulant risks.",
            ],
    });
  },
};
