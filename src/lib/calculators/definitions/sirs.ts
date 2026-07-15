import type { CalculatorDefinition } from "../types";
import { scoreResult, sumBooleanFields } from "../helpers";

export const sirs: CalculatorDefinition = {
  slug: "sirs",
  title: "SIRS Criteria",
  shortName: "SIRS",
  description:
    "Counts systemic inflammatory response criteria historically used in sepsis screening discussions.",
  category: "critical-care",
  icon: "thermometer",
  clinicalApplication:
    "Educational historical criteria. Modern practice emphasises qSOFA/SOFA and clinical pathways over SIRS alone.",
  evidence: {
    version: "1991 ACCP/SCCM SIRS criteria (four items)",
    intendedPopulation: "Adults in whom systemic inflammation is being discussed educationally.",
    exclusions: [
      "Use as the sole modern sepsis definition (superseded conceptually by Sepsis-3)",
      "Children without paediatric thresholds",
    ],
    references: [
      {
        title: "Definitions for sepsis and organ failure",
        citation: "Bone RC, et al. Chest. 1992;101(6):1644–1655.",
        url: "https://pubmed.ncbi.nlm.nih.gov/1303622/",
      },
      {
        title: "Sepsis-3 definitions",
        citation: "Singer M, et al. JAMA. 2016;315(8):801–810.",
        url: "https://pubmed.ncbi.nlm.nih.gov/26903338/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "temp", label: "Temperature < 36°C or > 38°C", type: "boolean" },
    { id: "hr", label: "Heart rate > 90/min", type: "boolean" },
    { id: "rr", label: "Respiratory rate > 20/min or PaCO₂ < 32 mmHg", type: "boolean" },
    { id: "wbc", label: "WBC < 4 or > 12 ×10⁹/L (or >10% bands)", type: "boolean" },
  ],
  calculate: (values) => {
    const score = sumBooleanFields(values, ["temp", "hr", "rr", "wbc"]);
    const positive = score >= 2;
    return scoreResult({
      score,
      maxScore: 4,
      label: positive ? "SIRS criteria met (≥2)" : "SIRS criteria not met",
      severity: positive ? "moderate" : "low",
      interpretation: `SIRS ${score}/4 criteria present.`,
      clinicalSignificance:
        "SIRS is non-specific and common after trauma, pancreatitis, and many non-infectious insults.",
      limitations:
        "Poor specificity for infection. Not the current preferred sepsis definition framework.",
      details: [
        { label: "Temperature criterion", value: values.temp ? "Yes" : "No" },
        { label: "HR criterion", value: values.hr ? "Yes" : "No" },
        { label: "RR/PaCO₂ criterion", value: values.rr ? "Yes" : "No" },
        { label: "WBC criterion", value: values.wbc ? "Yes" : "No" },
      ],
      recommendations: [
        "Seek infection source and organ dysfunction rather than relying on SIRS alone.",
        "Follow current local sepsis screening tools.",
      ],
    });
  },
};
