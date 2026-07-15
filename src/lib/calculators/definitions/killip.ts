import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const killip: CalculatorDefinition = {
  slug: "killip-class",
  title: "Killip Class",
  shortName: "Killip",
  description:
    "Clinical classification of heart-failure severity in acute myocardial infarction.",
  category: "cardiology",
  icon: "heart-pulse",
  clinicalApplication:
    "Supports bedside severity description in ACS teaching. Complements modern risk scores (GRACE, TIMI).",
  evidence: {
    version: "Killip–Kimball classes I–IV",
    intendedPopulation: "Adults with acute myocardial infarction and clinical volume assessment.",
    exclusions: [
      "Non-MI acute heart failure without ACS context",
      "Use as the sole modern ACS risk tool",
    ],
    references: [
      {
        title: "Treatment of myocardial infarction in a coronary care unit",
        citation: "Killip T, Kimball JT. Am J Cardiol. 1967;20(4):457–464.",
        url: "https://pubmed.ncbi.nlm.nih.gov/6059183/",
      },
      {
        title: "Killip class and mortality in ACS registries",
        citation: "Khot UN, et al. JAMA. 2003;290(16):2174–2181.",
        url: "https://pubmed.ncbi.nlm.nih.gov/14570953/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "class",
      label: "Killip class",
      type: "select",
      options: [
        { label: "I — No clinical heart failure", value: "1", points: 1 },
        { label: "II — Mild HF (S3, rales ≤½ lung fields)", value: "2", points: 2 },
        { label: "III — Pulmonary oedema", value: "3", points: 3 },
        { label: "IV — Cardiogenic shock", value: "4", points: 4 },
      ],
    },
  ],
  calculate: (values) => {
    const score = Number(values.class) || 1;
    const labels: Record<number, string> = {
      1: "Killip I — no clinical HF",
      2: "Killip II — mild HF",
      3: "Killip III — frank pulmonary oedema",
      4: "Killip IV — cardiogenic shock",
    };
    const severity =
      score === 1 ? "low" : score === 2 ? "moderate" : score === 3 ? "high" : "critical";
    return scoreResult({
      score,
      maxScore: 4,
      label: labels[score] ?? "Killip class",
      severity,
      interpretation: labels[score] ?? `Killip class ${score}`,
      clinicalSignificance:
        "Higher Killip class is associated with higher short-term mortality in AMI cohorts and should prompt intensified care.",
      limitations:
        "Subjective clinical signs. Does not replace imaging, biomarkers, or haemodynamic assessment.",
      recommendations:
        score >= 3
          ? [
              "Urgent senior/cardiology review and monitored care.",
              "Assess for reperfusion strategy, oxygenation, and shock management per ACS pathway.",
            ]
          : [
              "Continue ACS pathway with serial assessment for evolving failure.",
              "Reclassify if rales, hypoxia, or hypoperfusion develop.",
            ],
    });
  },
};
