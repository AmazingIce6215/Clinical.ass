import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const fib4: CalculatorDefinition = {
  slug: "fib-4",
  title: "FIB-4 Index for Hepatic Fibrosis",
  shortName: "FIB-4",
  description:
    "Non-invasive estimate of advanced fibrosis risk using age, AST, ALT, and platelet count.",
  category: "hepatology",
  icon: "stethoscope",
  clinicalApplication:
    "Risk-stratifies fibrosis in NAFLD/viral hepatitis teaching. Not a biopsy substitute.",
  evidence: {
    version: "FIB-4 (Sterling / common NAFLD cut-offs)",
    intendedPopulation: "Adults with chronic liver disease (commonly NAFLD or viral hepatitis).",
    exclusions: [
      "Acute hepatitis with extreme aminotransferase spikes",
      "Children",
      "Thrombocytopenia from non-hepatic causes without context",
    ],
    references: [
      {
        title: "Development of a simple noninvasive index to predict significant fibrosis in patients with HIV/HCV coinfection",
        citation: "Sterling RK, et al. Hepatology. 2006;43(6):1317–1325.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16729309/",
      },
      {
        title: "FIB-4 in NAFLD fibrosis assessment",
        citation: "Shah AG, et al. Clin Gastroenterol Hepatol. 2009;7(10):1104–1112.",
        url: "https://pubmed.ncbi.nlm.nih.gov/19523535/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "age", label: "Age", type: "number", suffix: "years", min: 18, max: 100, step: 1 },
    { id: "ast", label: "AST", type: "number", suffix: "U/L", min: 1, max: 5000, step: 1 },
    { id: "alt", label: "ALT", type: "number", suffix: "U/L", min: 1, max: 5000, step: 1 },
    { id: "plt", label: "Platelets", type: "number", suffix: "×10⁹/L", min: 10, max: 1000, step: 1 },
  ],
  calculate: (values) => {
    const age = asNumber(values.age);
    const ast = asNumber(values.ast);
    const alt = asNumber(values.alt);
    const plt = asNumber(values.plt);
    if (alt <= 0 || plt <= 0) throw new Error("ALT and platelets must be greater than zero.");
    const fib4 = (age * ast) / (plt * Math.sqrt(alt));

    let severity: "low" | "moderate" | "high" = "low";
    let label = "Lower fibrosis risk band (FIB-4 < 1.3)";
    if (fib4 >= 2.67) {
      severity = "high";
      label = "Higher risk of advanced fibrosis (FIB-4 ≥ 2.67)";
    } else if (fib4 >= 1.3) {
      severity = "moderate";
      label = "Indeterminate band (1.3–2.67)";
    }

    return formulaResult({
      value: fib4,
      digits: 2,
      label,
      severity,
      interpretation: `FIB-4 ${roundTo(fib4, 2)}.`,
      clinicalSignificance:
        "Common NAFLD cut-offs use <1.3 to suggest low risk of advanced fibrosis and ≥2.67 higher risk; age-specific cut-offs exist for older adults.",
      limitations:
        "Indeterminate zone is large. Performance varies by etiology. Elastography/biopsy may still be needed.",
      details: [
        { label: "Age", value: `${age}` },
        { label: "AST", value: `${ast}` },
        { label: "ALT", value: `${alt}` },
        { label: "Platelets", value: `${plt}` },
        { label: "FIB-4", value: `${roundTo(fib4, 2)}` },
      ],
      recommendations: [
        "Combine with metabolic risk assessment and specialist pathways for NAFLD.",
        "Consider elastography when scores are indeterminate or high.",
      ],
    });
  },
};
