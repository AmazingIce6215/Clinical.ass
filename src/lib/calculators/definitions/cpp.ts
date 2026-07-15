import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const cpp: CalculatorDefinition = {
  slug: "cerebral-perfusion-pressure",
  title: "Cerebral Perfusion Pressure",
  shortName: "CPP",
  description: "Estimates cerebral perfusion pressure as MAP minus ICP.",
  category: "critical-care",
  icon: "brain",
  clinicalApplication:
    "Neurocritical-care teaching for TBI and raised ICP management.",
  evidence: {
    version: "CPP = MAP − ICP",
    intendedPopulation: "Patients with invasive ICP monitoring and arterial pressure measurement.",
    exclusions: [
      "Use without validated MAP/ICP monitoring setup",
      "Sole target without considering autoregulation and clinical exam",
    ],
    references: [
      {
        title: "Guidelines for the Management of Severe Traumatic Brain Injury",
        citation: "Brain Trauma Foundation / AANS/CNS guidelines series.",
        url: "https://pubmed.ncbi.nlm.nih.gov/27654000/",
      },
      {
        title: "Cerebral perfusion pressure concepts",
        citation: "Rosner MJ, et al. J Neurosurg. 1995;83(6):949–962.",
        url: "https://pubmed.ncbi.nlm.nih.gov/7490611/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "map", label: "Mean arterial pressure", type: "number", suffix: "mmHg", min: 30, max: 200, step: 1 },
    { id: "icp", label: "Intracranial pressure", type: "number", suffix: "mmHg", min: 0, max: 100, step: 1 },
  ],
  calculate: (values) => {
    const map = asNumber(values.map);
    const icp = asNumber(values.icp);
    const value = map - icp;
    let severity: "low" | "moderate" | "high" | "critical" = "low";
    let label = "CPP in a commonly targeted adult band";
    if (value < 50) {
      severity = "critical";
      label = "Low CPP band";
    } else if (value < 60) {
      severity = "high";
      label = "Borderline low CPP band";
    } else if (value > 90) {
      severity = "moderate";
      label = "High CPP band — review targets";
    }
    return formulaResult({
      value,
      unit: "mmHg",
      digits: 0,
      label,
      severity,
      interpretation: `CPP ${roundTo(value, 0)} mmHg (MAP ${map} − ICP ${icp}).`,
      clinicalSignificance:
        "Many adult TBI protocols discuss CPP targets around 60–70 mmHg, individualised to the patient.",
      limitations:
        "Depends on accurate zeroing of transducers and head-of-bed conventions.",
      details: [
        { label: "MAP", value: `${map} mmHg` },
        { label: "ICP", value: `${icp} mmHg` },
        { label: "CPP", value: `${roundTo(value, 0)} mmHg` },
      ],
      recommendations: [
        "Treat raised ICP and support MAP per neurocritical-care protocol.",
        "Avoid indiscriminate vasopressors without ICP control and monitoring.",
      ],
    });
  },
};
