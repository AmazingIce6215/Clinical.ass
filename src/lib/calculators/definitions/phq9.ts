import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

const phqOptions = [
  { label: "Not at all (0)", value: "0", points: 0 },
  { label: "Several days (1)", value: "1", points: 1 },
  { label: "More than half the days (2)", value: "2", points: 2 },
  { label: "Nearly every day (3)", value: "3", points: 3 },
];

const items = [
  { id: "interest", label: "Little interest or pleasure in doing things" },
  { id: "depressed", label: "Feeling down, depressed, or hopeless" },
  { id: "sleep", label: "Trouble falling/staying asleep, or sleeping too much" },
  { id: "energy", label: "Feeling tired or having little energy" },
  { id: "appetite", label: "Poor appetite or overeating" },
  { id: "failure", label: "Feeling bad about yourself — or that you are a failure" },
  { id: "concentrate", label: "Trouble concentrating on things" },
  { id: "motor", label: "Moving or speaking slowly, or being fidgety/restless" },
  { id: "suicide", label: "Thoughts that you would be better off dead, or of hurting yourself" },
];

export const phq9: CalculatorDefinition = {
  slug: "phq-9",
  title: "Patient Health Questionnaire-9 (PHQ-9)",
  shortName: "PHQ-9",
  description:
    "Nine-item depression symptom severity measure used for screening and monitoring.",
  category: "mental-health",
  icon: "brain",
  clinicalApplication:
    "Educational screening severity tool. Positive screens require clinical interview and safety assessment—not diagnosis by score alone.",
  evidence: {
    version: "PHQ-9 (Kroenke)",
    intendedPopulation: "Adults in primary/secondary care depression screening contexts.",
    exclusions: [
      "Sole diagnostic tool without clinical assessment",
      "Emergency suicidal crisis without immediate safety pathway",
    ],
    references: [
      {
        title: "The PHQ-9: validity of a brief depression severity measure",
        citation: "Kroenke K, Spitzer RL, Williams JB. J Gen Intern Med. 2001;16(9):606–613.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11556941/",
      },
      {
        title: "PHQ-9 use in clinical practice",
        citation: "Kroenke K, Spitzer RL. Psychiatr Ann. 2002;32:509–521.",
        url: "https://doi.org/10.3928/0048-5713-20020901-06",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: items.map((item) => ({
    id: item.id,
    label: item.label,
    type: "select" as const,
    options: phqOptions,
  })),
  calculate: (values) => {
    const score = sumSelectPoints(
      values,
      items.map((item) => ({ id: item.id, options: phqOptions })),
    );
    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Minimal depression symptom band (0–4)";
    if (score >= 20) {
      severity = "severe";
      label = "Severe symptom band (20–27)";
    } else if (score >= 15) {
      severity = "high";
      label = "Moderately severe symptom band (15–19)";
    } else if (score >= 10) {
      severity = "moderate";
      label = "Moderate symptom band (10–14)";
    } else if (score >= 5) {
      severity = "moderate";
      label = "Mild symptom band (5–9)";
    }
    const suicidePts = Number(values.suicide) || 0;
    return scoreResult({
      score,
      maxScore: 27,
      label,
      severity: suicidePts > 0 && severity === "low" ? "high" : severity,
      interpretation: `PHQ-9 total ${score}/27.${suicidePts > 0 ? " Item 9 is positive — prioritise safety assessment." : ""}`,
      clinicalSignificance:
        "Scores guide severity discussion and monitoring; diagnosis requires clinical criteria and context.",
      limitations:
        "Self-report bias. Medical illness can inflate somatic items. Not a suicide risk prediction model.",
      recommendations: [
        "If item 9 is positive, perform an immediate safety assessment and escalate per local pathway.",
        "Combine with functional impact assessment and shared treatment planning.",
      ],
    });
  },
};
