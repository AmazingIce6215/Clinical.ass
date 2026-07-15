import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const canadianCtHead: CalculatorDefinition = {
  slug: "canadian-ct-head",
  title: "Canadian CT Head Rule",
  shortName: "CCHR",
  description:
    "Clinical decision rule for CT imaging after minor head injury in adults.",
  category: "trauma",
  icon: "brain",
  clinicalApplication:
    "Guides CT decisions after minor blunt head trauma when GCS is 13–15.",
  evidence: {
    version: "Canadian CT Head Rule (high- and medium-risk criteria)",
    intendedPopulation:
      "Adults with minor head injury (GCS 13–15) and loss of consciousness, amnesia, or disorientation.",
    exclusions: [
      "Age < 16 years",
      "GCS < 13",
      "Anticoagulation / bleeding disorder (local pathways often image)",
      "Open skull fracture or penetrating injury",
      "Seizure before assessment in some implementations",
    ],
    references: [
      {
        title: "The Canadian CT Head Rule for patients with minor head injury",
        citation: "Stiell IG, et al. Lancet. 2001;357(9266):1391–1396.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11356436/",
      },
      {
        title: "Comparison of the Canadian CT Head Rule and the New Orleans Criteria",
        citation: "Stiell IG, et al. JAMA. 2005;294(12):1511–1518.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16189364/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "gcs_lt15_2h", label: "GCS < 15 at 2 hours after injury (high risk)", type: "boolean" },
    { id: "suspected_open", label: "Suspected open or depressed skull fracture (high risk)", type: "boolean" },
    { id: "basal_signs", label: "Any sign of basal skull fracture (high risk)", type: "boolean" },
    { id: "vomiting_2", label: "Vomiting ≥ 2 episodes (high risk)", type: "boolean" },
    { id: "age_65", label: "Age ≥ 65 years (high risk)", type: "boolean" },
    { id: "amnesia_30", label: "Amnesia before impact ≥ 30 minutes (medium risk)", type: "boolean" },
    {
      id: "dangerous_mechanism",
      label: "Dangerous mechanism (pedestrian struck, ejection, fall from elevation) (medium risk)",
      type: "boolean",
    },
  ],
  calculate: (values) => {
    const high = sumBooleanFields(values, [
      "gcs_lt15_2h",
      "suspected_open",
      "basal_signs",
      "vomiting_2",
      "age_65",
    ]);
    const medium = sumBooleanFields(values, ["amnesia_30", "dangerous_mechanism"]);
    const score = high * 2 + medium;
    const ctIndicated = high > 0 || medium > 0;

    return scoreResult({
      score,
      maxScore: 12,
      label: ctIndicated
        ? high > 0
          ? "High-risk criterion present — CT recommended"
          : "Medium-risk criterion present — CT recommended"
        : "No CCHR imaging criteria — CT may be avoided if rule applies",
      severity: high > 0 ? "high" : medium > 0 ? "moderate" : "low",
      interpretation: ctIndicated
        ? `CT indicated (${high} high-risk, ${medium} medium-risk features).`
        : "No Canadian CT Head Rule criteria met.",
      clinicalSignificance:
        "Highly sensitive for neurosurgical injuries in derivation/validation cohorts when inclusion criteria are met.",
      limitations:
        "Does not apply to anticoagulated patients in many local protocols. Clinical concern can still override a negative rule.",
      recommendations: ctIndicated
        ? [
            "Arrange non-contrast head CT and neurological observations.",
            "Escalate urgently for focal deficit, seizure, or deteriorating GCS.",
          ]
        : [
            "Provide head-injury advice and safety-netting.",
            "Reassess if vomiting, drowsiness, or neurological symptoms develop.",
          ],
    });
  },
};
