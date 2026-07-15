import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const nexusCspine: CalculatorDefinition = {
  slug: "nexus-cspine",
  title: "NEXUS C-Spine Criteria",
  shortName: "NEXUS",
  description:
    "Five criteria to identify trauma patients at very low risk of cervical spine injury who may not need imaging.",
  category: "trauma",
  icon: "bone",
  clinicalApplication:
    "For blunt trauma patients when deciding on cervical spine imaging. Canadian C-spine rule is an alternative tool.",
  evidence: {
    version: "NEXUS low-risk criteria",
    intendedPopulation: "Blunt trauma patients undergoing C-spine injury risk assessment.",
    exclusions: [
      "Penetrating trauma",
      "Unreliable examination (intoxication already captured as a criterion)",
      "High-risk mechanisms where local policy mandates imaging regardless",
    ],
    references: [
      {
        title: "Validity of a set of clinical criteria to rule out injury to the cervical spine in patients with blunt trauma",
        citation: "Hoffman JR, et al. N Engl J Med. 2000;343(2):94–99.",
        url: "https://pubmed.ncbi.nlm.nih.gov/10891516/",
      },
      {
        title: "NEXUS vs Canadian C-spine rule comparisons",
        citation: "Stiell IG, et al. N Engl J Med. 2003;349(26):2510–2518.",
        url: "https://pubmed.ncbi.nlm.nih.gov/14695411/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "midline", label: "Midline cervical tenderness", type: "boolean" },
    { id: "intoxication", label: "Evidence of intoxication", type: "boolean" },
    { id: "alertness", label: "Altered level of alertness", type: "boolean" },
    { id: "neuro", label: "Focal neurological deficit", type: "boolean" },
    { id: "distracting", label: "Painful distracting injury", type: "boolean" },
  ],
  calculate: (values) => {
    const positives = sumBooleanFields(values, [
      "midline",
      "intoxication",
      "alertness",
      "neuro",
      "distracting",
    ]);
    const clear = positives === 0;
    return scoreResult({
      score: positives,
      maxScore: 5,
      label: clear
        ? "NEXUS negative — imaging may be unnecessary if applied correctly"
        : "NEXUS positive — imaging cannot be deferred by NEXUS alone",
      severity: clear ? "low" : "moderate",
      interpretation: clear
        ? "No NEXUS high-risk features present."
        : `${positives} NEXUS feature(s) present.`,
      clinicalSignificance:
        "When all criteria are absent, cervical spine imaging can often be avoided in appropriate blunt trauma cohorts.",
      limitations:
        "Requires reliable examination. Local trauma protocols may prefer the Canadian C-spine rule.",
      recommendations: clear
        ? [
            "Document a careful neurological and neck exam.",
            "Maintain spinal precautions until the full assessment is complete if still indicated.",
          ]
        : [
            "Arrange cervical spine imaging per trauma pathway.",
            "Continue immobilisation until injury is excluded.",
          ],
    });
  },
};
