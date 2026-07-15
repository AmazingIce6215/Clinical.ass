import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const pecarnHead: CalculatorDefinition = {
  slug: "pecarn-head",
  title: "PECARN Pediatric Head Injury (≥2 years)",
  shortName: "PECARN ≥2y",
  description:
    "Decision rule for CT after minor blunt head trauma in children aged 2 years and older.",
  category: "pediatrics",
  icon: "baby",
  clinicalApplication:
    "Reduces unnecessary CT while identifying children who need imaging after head injury.",
  evidence: {
    version: "PECARN rule for age ≥2 years",
    intendedPopulation: "Children ≥2 years with minor blunt head trauma (GCS 14–15).",
    exclusions: [
      "Age < 2 years (use infant PECARN rule)",
      "GCS ≤ 13",
      "Penetrating trauma / known brain tumour / ventricular shunt in some protocols",
    ],
    references: [
      {
        title: "Identification of children at very low risk of clinically-important brain injuries after head trauma",
        citation: "Kuppermann N, et al. Lancet. 2009;374(9696):1160–1170.",
        url: "https://pubmed.ncbi.nlm.nih.gov/19758692/",
      },
      {
        title: "PECARN validation literature",
        citation: "Multiple subsequent validation studies in paediatric emergency care.",
        url: "https://pubmed.ncbi.nlm.nih.gov/19758692/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "ams",
      label: "Altered mental status (agitation, somnolence, repetitive questioning, slow response) or GCS 14",
      type: "boolean",
    },
    { id: "basilar", label: "Signs of basilar skull fracture", type: "boolean" },
    { id: "vomiting", label: "History of vomiting", type: "boolean" },
    { id: "severe_mechanism", label: "Severe mechanism of injury", type: "boolean" },
    { id: "severe_headache", label: "Severe headache", type: "boolean" },
  ],
  calculate: (values) => {
    const highRisk = Boolean(values.ams) || Boolean(values.basilar);
    const intermediate =
      !highRisk &&
      (Boolean(values.vomiting) ||
        Boolean(values.severe_mechanism) ||
        Boolean(values.severe_headache));
    if (highRisk) {
      return scoreResult({
        score: 2,
        maxScore: 2,
        label: "Higher-risk PECARN features — CT recommended",
        severity: "high",
        interpretation: "Altered mental status and/or basilar skull fracture signs present.",
        clinicalSignificance:
          "These features identify higher risk of clinically important TBI; CT is generally recommended.",
        limitations: "Clinical judgment still required for observation vs immediate CT logistics.",
        recommendations: [
          "Arrange CT head and neurological observation.",
          "Escalate for focal neurology or deterioration.",
        ],
      });
    }
    if (intermediate) {
      return scoreResult({
        score: 1,
        maxScore: 2,
        label: "Intermediate PECARN features — CT vs observation shared decision",
        severity: "moderate",
        interpretation: "One or more intermediate-risk features without high-risk features.",
        clinicalSignificance:
          "Observation may be appropriate for many; CT if multiple features, worsening, or caregiver preference after counselling.",
        limitations: "Exact CT rates depend on clinician preference and reliability of observation.",
        recommendations: [
          "Discuss observation vs CT with caregivers.",
          "Provide strict head-injury safety-net advice if observed.",
        ],
      });
    }
    return scoreResult({
      score: 0,
      maxScore: 2,
      label: "Very low risk — CT generally not recommended",
      severity: "low",
      interpretation: "No PECARN predictors present for age ≥2 years.",
      clinicalSignificance:
        "Risk of clinically important TBI is very low; CT can usually be avoided.",
      limitations: "Does not apply if inclusion criteria are not met.",
      recommendations: [
        "Discharge with head-injury advice when appropriate.",
        "Return precautions for vomiting, drowsiness, seizure, or behaviour change.",
      ],
    });
  },
};
