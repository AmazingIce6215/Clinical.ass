import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const charlson: CalculatorDefinition = {
  slug: "charlson",
  title: "Charlson Comorbidity Index",
  shortName: "CCI",
  description:
    "Weighted comorbidity score used to estimate long-term mortality risk and case-mix.",
  category: "general",
  icon: "hospital",
  clinicalApplication:
    "Research/case-mix style comorbidity burden estimate. Not an acute triage score.",
  evidence: {
    version: "Original Charlson index weights (educational)",
    intendedPopulation: "Adults for comorbidity burden description.",
    exclusions: [
      "Use as sole acute prognosis tool",
      "Missing chart review for conditions",
    ],
    references: [
      {
        title: "A new method of classifying prognostic comorbidity in longitudinal studies",
        citation: "Charlson ME, et al. J Chronic Dis. 1987;40(5):373–383.",
        url: "https://pubmed.ncbi.nlm.nih.gov/3558716/",
      },
      {
        title: "Updating/adapting Charlson comorbidity for ICD coding contexts",
        citation: "Quan H, et al. Med Care. 2005;43(11):1130–1139.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16224307/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "mi", label: "Myocardial infarction (1)", type: "boolean" },
    { id: "chf", label: "Congestive heart failure (1)", type: "boolean" },
    { id: "pvd", label: "Peripheral vascular disease (1)", type: "boolean" },
    { id: "cva", label: "Cerebrovascular disease (1)", type: "boolean" },
    { id: "dementia", label: "Dementia (1)", type: "boolean" },
    { id: "copd", label: "Chronic pulmonary disease (1)", type: "boolean" },
    { id: "ctd", label: "Connective tissue disease (1)", type: "boolean" },
    { id: "ulcer", label: "Peptic ulcer disease (1)", type: "boolean" },
    { id: "liver_mild", label: "Mild liver disease (1)", type: "boolean" },
    { id: "dm", label: "Diabetes without end-organ damage (1)", type: "boolean" },
    { id: "dm_end", label: "Diabetes with end-organ damage (2)", type: "boolean" },
    { id: "hemiplegia", label: "Hemiplegia (2)", type: "boolean" },
    { id: "ckd", label: "Moderate–severe renal disease (2)", type: "boolean" },
    { id: "cancer", label: "Any tumour without metastasis (2)", type: "boolean" },
    { id: "leukemia", label: "Leukemia (2)", type: "boolean" },
    { id: "lymphoma", label: "Lymphoma (2)", type: "boolean" },
    { id: "liver_severe", label: "Moderate–severe liver disease (3)", type: "boolean" },
    { id: "metastatic", label: "Metastatic solid tumour (6)", type: "boolean" },
    { id: "aids", label: "AIDS (6)", type: "boolean" },
    {
      id: "age_band",
      label: "Age points (common adaptation)",
      type: "select",
      options: [
        { label: "< 50 (0)", value: "0", points: 0 },
        { label: "50–59 (1)", value: "1", points: 1 },
        { label: "60–69 (2)", value: "2", points: 2 },
        { label: "70–79 (3)", value: "3", points: 3 },
        { label: "≥ 80 (4)", value: "4", points: 4 },
      ],
    },
  ],
  calculate: (values) => {
    // diabetes: if end-organ, don't double count simple dm
    const dmPts = values.dm_end ? 2 : values.dm ? 1 : 0;
    const liverPts = values.liver_severe ? 3 : values.liver_mild ? 1 : 0;
    const cancerPts = values.metastatic ? 6 : values.cancer ? 2 : 0;
    const score =
      (values.mi ? 1 : 0) +
      (values.chf ? 1 : 0) +
      (values.pvd ? 1 : 0) +
      (values.cva ? 1 : 0) +
      (values.dementia ? 1 : 0) +
      (values.copd ? 1 : 0) +
      (values.ctd ? 1 : 0) +
      (values.ulcer ? 1 : 0) +
      liverPts +
      dmPts +
      (values.hemiplegia ? 2 : 0) +
      (values.ckd ? 2 : 0) +
      cancerPts +
      (values.leukemia ? 2 : 0) +
      (values.lymphoma ? 2 : 0) +
      (values.aids ? 6 : 0) +
      (Number(values.age_band) || 0);

    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "Lower comorbidity burden band";
    if (score >= 5) {
      severity = "severe";
      label = "Very high comorbidity band";
    } else if (score >= 3) {
      severity = "high";
      label = "High comorbidity band";
    } else if (score >= 1) {
      severity = "moderate";
      label = "Mild–moderate comorbidity band";
    }

    return scoreResult({
      score,
      maxScore: 37,
      label,
      severity,
      interpretation: `Charlson index ${score}.`,
      clinicalSignificance:
        "Higher scores associate with higher long-term mortality in original medical cohorts and are widely used for risk adjustment.",
      limitations:
        "Coding definitions vary. Not designed for hour-to-hour acute decisions.",
      recommendations: [
        "Use to contextualise chronic disease burden in care planning.",
        "Pair with functional status and patient goals.",
      ],
    });
  },
};
