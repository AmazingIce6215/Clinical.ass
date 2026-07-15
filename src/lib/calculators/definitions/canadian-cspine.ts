import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const canadianCspine: CalculatorDefinition = {
  slug: "canadian-cspine",
  title: "Canadian C-Spine Rule",
  shortName: "CCR",
  description:
    "Decision rule for cervical spine imaging after blunt trauma in alert, stable patients.",
  category: "trauma",
  icon: "bone",
  clinicalApplication:
    "Alternative to NEXUS for C-spine imaging decisions after blunt trauma.",
  evidence: {
    version: "Canadian C-Spine Rule (Stiell)",
    intendedPopulation:
      "Alert (GCS 15) and stable adults with blunt trauma and neck pain or concerning mechanism.",
    exclusions: [
      "Non-trauma neck pain",
      "GCS < 15",
      "Unstable vital signs",
      "Age < 16 years",
      "Known vertebral disease (e.g. ankylosing spondylitis) in many protocols",
    ],
    references: [
      {
        title: "The Canadian C-spine rule for radiography in alert and stable trauma patients",
        citation: "Stiell IG, et al. JAMA. 2001;286(15):1841–1848.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11597285/",
      },
      {
        title: "Canadian C-spine rule vs NEXUS",
        citation: "Stiell IG, et al. N Engl J Med. 2003;349(26):2510–2518.",
        url: "https://pubmed.ncbi.nlm.nih.gov/14695411/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "high_risk",
      label: "Any high-risk factor?",
      type: "select",
      options: [
        { label: "No high-risk factors", value: "no", points: 0 },
        { label: "Age ≥ 65, dangerous mechanism, or paresthesias in extremities", value: "yes", points: 1 },
      ],
      helpText: "Dangerous mechanism: fall ≥3 ft/5 stairs, axial load, high-speed MVC/rollover/ejection, motorized recreational vehicle, bicycle collision.",
    },
    {
      id: "low_risk",
      label: "Any low-risk factor that allows safe assessment of range of motion?",
      type: "select",
      options: [
        { label: "Yes (simple rear-end MVC, sitting in ED, ambulatory, delayed onset neck pain, or absence of midline C-spine tenderness)", value: "yes", points: 0 },
        { label: "No low-risk factor present", value: "no", points: 1 },
      ],
    },
    {
      id: "rom",
      label: "Able to actively rotate neck 45° left and right?",
      type: "select",
      options: [
        { label: "Yes", value: "yes", points: 0 },
        { label: "No", value: "no", points: 1 },
        { label: "Not assessed (imaging already indicated or unsafe)", value: "na", points: 1 },
      ],
    },
  ],
  calculate: (values) => {
    if (values.high_risk === "yes") {
      return scoreResult({
        score: 2,
        maxScore: 2,
        label: "Imaging indicated — high-risk factor present",
        severity: "high",
        interpretation: "Canadian C-spine rule: radiography/CT indicated due to high-risk feature.",
        clinicalSignificance:
          "High-risk features mandate imaging without range-of-motion testing.",
        limitations: "Requires correct identification of dangerous mechanisms.",
        recommendations: [
          "Obtain C-spine imaging per trauma protocol.",
          "Maintain immobilisation until injury is excluded.",
        ],
      });
    }
    if (values.low_risk === "no") {
      return scoreResult({
        score: 2,
        maxScore: 2,
        label: "Imaging indicated — no low-risk factor to permit ROM testing",
        severity: "moderate",
        interpretation: "Without a low-risk factor, range-of-motion testing is not used to clear the spine.",
        clinicalSignificance: "Imaging is recommended when low-risk factors are absent.",
        limitations: "Rule application errors are common around rear-end MVC definitions.",
        recommendations: [
          "Arrange imaging and keep spinal precautions.",
          "Document neurological examination carefully.",
        ],
      });
    }
    if (values.rom === "yes") {
      return scoreResult({
        score: 0,
        maxScore: 2,
        label: "Imaging may be avoided — rule negative",
        severity: "low",
        interpretation: "No high-risk factors, ≥1 low-risk factor, and active 45° rotation possible bilaterally.",
        clinicalSignificance:
          "When the rule is negative, cervical imaging can often be deferred in eligible patients.",
        limitations: "Clinical concern or unreliable exam can still justify imaging.",
        recommendations: [
          "Document full neuro exam and rule components.",
          "Provide neck-injury advice and safety-netting.",
        ],
      });
    }
    return scoreResult({
      score: 1,
      maxScore: 2,
      label: "Imaging indicated — unable to rotate neck 45°",
      severity: "moderate",
      interpretation: "Low-risk pathway reached ROM testing but rotation was limited or not assessable.",
      clinicalSignificance: "Inability to rotate 45° left and right indicates imaging.",
      limitations: "Pain-limited ROM still counts as inability in the rule.",
      recommendations: [
        "Obtain imaging and maintain precautions.",
        "Reassess neurology if symptoms progress.",
      ],
    });
  },
};
