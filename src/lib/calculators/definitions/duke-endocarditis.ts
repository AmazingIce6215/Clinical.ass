import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const dukeEndocarditis: CalculatorDefinition = {
  slug: "duke-endocarditis",
  title: "Modified Duke Criteria (Endocarditis)",
  shortName: "Duke IE",
  description:
    "Diagnostic classification of infective endocarditis as definite, possible, or rejected.",
  category: "infectious-disease",
  icon: "heart-pulse",
  clinicalApplication:
    "Structures IE diagnosis using major and minor criteria. Specialist imaging and cultures remain essential.",
  evidence: {
    version: "Modified Duke criteria (educational checklist)",
    intendedPopulation: "Adults evaluated for suspected infective endocarditis.",
    exclusions: [
      "Sole reliance without blood cultures and echocardiography",
      "Paediatric pathways may use adapted criteria",
    ],
    references: [
      {
        title: "New criteria for diagnosis of infective endocarditis",
        citation: "Durack DT, et al. Am J Med. 1994;96(3):200–209.",
        url: "https://pubmed.ncbi.nlm.nih.gov/8154507/",
      },
      {
        title: "Proposed modifications to the Duke criteria",
        citation: "Li JS, et al. Clin Infect Dis. 2000;30(4):633–638.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10770721/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "major",
      label: "Number of major criteria met",
      type: "select",
      options: [
        { label: "0 major", value: "0", points: 0 },
        { label: "1 major", value: "1", points: 1 },
        { label: "2 major", value: "2", points: 2 },
      ],
      helpText: "Major: typical blood culture organisms / Q fever serology; evidence of endocardial involvement on imaging.",
    },
    {
      id: "minor",
      label: "Number of minor criteria met",
      type: "select",
      options: [
        { label: "0 minor", value: "0", points: 0 },
        { label: "1 minor", value: "1", points: 1 },
        { label: "2 minor", value: "2", points: 2 },
        { label: "3 minor", value: "3", points: 3 },
        { label: "4 minor", value: "4", points: 4 },
        { label: "5 minor", value: "5", points: 5 },
      ],
      helpText: "Minor: predisposition, fever, vascular phenomena, immunologic phenomena, microbiologic evidence not meeting major.",
    },
  ],
  calculate: (values) => {
    const major = Number(values.major) || 0;
    const minor = Number(values.minor) || 0;
    let label = "Rejected IE by clinical criteria";
    let severity: "low" | "moderate" | "high" = "low";
    let score = 0;
    if (major >= 2 || (major === 1 && minor >= 3) || minor >= 5) {
      label = "Definite IE (clinical criteria)";
      severity = "high";
      score = 3;
    } else if ((major === 1 && minor >= 1) || minor >= 3) {
      label = "Possible IE";
      severity = "moderate";
      score = 2;
    } else {
      score = 1;
    }
    return scoreResult({
      score,
      maxScore: 3,
      label,
      severity,
      interpretation: `${label} — major ${major}, minor ${minor}.`,
      clinicalSignificance:
        "Definite clinical IE warrants urgent ID/cardiology pathways; possible IE needs further work-up rather than automatic exclusion.",
      limitations:
        "Pathologic criteria (microorganisms in vegetation) can also define definite IE. 2023 ISCVID updates exist beyond classic Duke.",
      details: [
        { label: "Major criteria", value: String(major) },
        { label: "Minor criteria", value: String(minor) },
      ],
      recommendations:
        severity === "high"
          ? [
              "Urgent echocardiography (TOE if indicated), serial cultures, and specialist IE team input.",
              "Do not delay antibiotics in severe sepsis after cultures.",
            ]
          : severity === "moderate"
            ? [
                "Continue evaluation with imaging and cultures; avoid premature closure.",
                "Reclassify as data evolve.",
              ]
            : [
                "Seek alternative diagnoses if IE likelihood is low.",
                "Reconsider if new embolic or microbiologic findings appear.",
              ],
    });
  },
};
