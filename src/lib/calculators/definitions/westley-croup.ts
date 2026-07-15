import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const westleyCroup: CalculatorDefinition = {
  slug: "westley-croup",
  title: "Westley Croup Score",
  shortName: "Westley",
  description:
    "Severity score for paediatric croup based on stridor, retractions, air entry, cyanosis, and consciousness.",
  category: "pediatrics",
  icon: "baby",
  clinicalApplication:
    "Structures croup severity assessment and treatment intensity discussions.",
  evidence: {
    version: "Westley croup score",
    intendedPopulation: "Children with clinical croup (laryngotracheitis).",
    exclusions: [
      "Epiglottitis / bacterial tracheitis suspicion",
      "Foreign body airway obstruction",
    ],
    references: [
      {
        title: "Nebulized racemic epinephrine by IPPB for the treatment of croup",
        citation: "Westley CR, Cotton EK, Brooks JG. Am J Dis Child. 1978;132(5):484–487.",
        url: "https://pubmed.ncbi.nlm.nih.gov/347921/",
      },
      {
        title: "Croup in children",
        citation: "Bjornson CL, Johnson DW. CMAJ. 2013;185(15):1317–1323.",
        url: "https://pubmed.ncbi.nlm.nih.gov/23959268/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "stridor",
      label: "Stridor",
      type: "select",
      options: [
        { label: "None (0)", value: "0", points: 0 },
        { label: "With agitation (1)", value: "1", points: 1 },
        { label: "At rest (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "retractions",
      label: "Retractions",
      type: "select",
      options: [
        { label: "None (0)", value: "0", points: 0 },
        { label: "Mild (1)", value: "1", points: 1 },
        { label: "Moderate (2)", value: "2", points: 2 },
        { label: "Severe (3)", value: "3", points: 3 },
      ],
    },
    {
      id: "air_entry",
      label: "Air entry",
      type: "select",
      options: [
        { label: "Normal (0)", value: "0", points: 0 },
        { label: "Decreased (1)", value: "1", points: 1 },
        { label: "Markedly decreased (2)", value: "2", points: 2 },
      ],
    },
    {
      id: "cyanosis",
      label: "Cyanosis",
      type: "select",
      options: [
        { label: "None (0)", value: "0", points: 0 },
        { label: "With agitation (4)", value: "4", points: 4 },
        { label: "At rest (5)", value: "5", points: 5 },
      ],
    },
    {
      id: "consciousness",
      label: "Level of consciousness",
      type: "select",
      options: [
        { label: "Normal (0)", value: "0", points: 0 },
        { label: "Disoriented / altered (5)", value: "5", points: 5 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, westleyCroup.inputs);
    let severity: "low" | "moderate" | "high" | "critical" = "low";
    let label = "Mild croup band (≤2)";
    if (score >= 12) {
      severity = "critical";
      label = "Impending respiratory failure band (≥12)";
    } else if (score >= 6) {
      severity = "high";
      label = "Severe croup band (6–11)";
    } else if (score >= 3) {
      severity = "moderate";
      label = "Moderate croup band (3–5)";
    }
    return scoreResult({
      score,
      maxScore: 17,
      label,
      severity,
      interpretation: `Westley croup score ${score}/17.`,
      clinicalSignificance:
        "Higher scores correlate with need for more intensive therapy (nebulised adrenaline, observation).",
      limitations:
        "Subjective domains. Always prioritise airway assessment over scoring.",
      recommendations:
        score <= 2
          ? ["Consider dexamethasone and discharge advice if stable.", "Safety-net for stridor at rest or work of breathing."]
          : score <= 5
            ? ["Give corticosteroid; observe response.", "Consider nebulised adrenaline if distress increases."]
            : [
                "Urgent senior/paediatric review; oxygen and nebulised adrenaline as indicated.",
                "Prepare for possible airway intervention if deterioration.",
              ],
    });
  },
};
