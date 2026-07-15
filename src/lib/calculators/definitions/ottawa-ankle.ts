import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const ottawaAnkle: CalculatorDefinition = {
  slug: "ottawa-ankle",
  title: "Ottawa Ankle Rules",
  shortName: "Ottawa Ankle",
  description:
    "Clinical decision rule to determine when ankle or midfoot radiographs are indicated after acute injury.",
  category: "trauma",
  icon: "bone",
  clinicalApplication:
    "Reduces unnecessary radiographs in acute ankle/midfoot injuries when applied correctly.",
  evidence: {
    version: "Ottawa Ankle Rules (ankle and midfoot zones)",
    intendedPopulation:
      "Adults and older children with acute blunt ankle/midfoot injury within about 10 days.",
    exclusions: [
      "Pregnancy (relative; shared decision)",
      "Isolated skin injury without trauma mechanism",
      "Altered sensorium preventing reliable exam",
    ],
    references: [
      {
        title: "Decision rules for the use of radiography in acute ankle injuries",
        citation: "Stiell IG, et al. JAMA. 1993;269(9):1127–1132.",
        url: "https://pubmed.ncbi.nlm.nih.gov/8433468/",
      },
      {
        title: "Multicentre trial to introduce the Ottawa ankle rules",
        citation: "Stiell I, et al. BMJ. 1995;311(7005):594–597.",
        url: "https://pubmed.ncbi.nlm.nih.gov/7663253/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "malleolar_pain", label: "Pain in malleolar zone", type: "boolean" },
    { id: "bone_post_edge", label: "Bone tenderness at posterior edge/tip of lateral or medial malleolus", type: "boolean" },
    { id: "unable_steps_ankle", label: "Unable to bear weight both immediately and in ED (4 steps)", type: "boolean" },
    { id: "midfoot_pain", label: "Pain in midfoot zone", type: "boolean" },
    { id: "navicular", label: "Bone tenderness at navicular", type: "boolean" },
    { id: "base_5mt", label: "Bone tenderness at base of 5th metatarsal", type: "boolean" },
    { id: "unable_steps_foot", label: "Unable to bear weight both immediately and in ED (midfoot assessment)", type: "boolean" },
  ],
  calculate: (values) => {
    const ankleXray =
      Boolean(values.malleolar_pain) &&
      (Boolean(values.bone_post_edge) || Boolean(values.unable_steps_ankle));
    const footXray =
      Boolean(values.midfoot_pain) &&
      (Boolean(values.navicular) || Boolean(values.base_5mt) || Boolean(values.unable_steps_foot));
    const score = (ankleXray ? 1 : 0) + (footXray ? 1 : 0);
    return scoreResult({
      score,
      maxScore: 2,
      label:
        !ankleXray && !footXray
          ? "Radiographs may not be required by Ottawa rules"
          : ankleXray && footXray
            ? "Ankle and foot radiographs indicated"
            : ankleXray
              ? "Ankle radiographs indicated"
              : "Foot radiographs indicated",
      severity: score === 0 ? "low" : "moderate",
      interpretation:
        !ankleXray && !footXray
          ? "No Ottawa imaging zone triggered."
          : `Imaging suggested — ankle: ${ankleXray ? "yes" : "no"}; midfoot: ${footXray ? "yes" : "no"}.`,
      clinicalSignificance:
        "Highly sensitive for clinically important fractures when applied to appropriate patients; specificity is modest.",
      limitations:
        "Requires careful palpation landmarks. Not a substitute for clinical concern about high-risk mechanisms.",
      details: [
        { label: "Ankle series indicated", value: ankleXray ? "Yes" : "No" },
        { label: "Foot series indicated", value: footXray ? "Yes" : "No" },
      ],
      recommendations:
        score === 0
          ? [
              "Provide RICE advice, analgesia, and safety-net for inability to weight-bear or worsening swelling.",
              "Reassess if symptoms persist beyond expected soft-tissue recovery.",
            ]
          : [
              "Obtain the indicated radiograph series.",
              "Immobilise and arrange follow-up if fracture is confirmed.",
            ],
    });
  },
};
