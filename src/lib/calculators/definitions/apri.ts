import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const apri: CalculatorDefinition = {
  slug: "apri",
  title: "APRI (AST to Platelet Ratio Index)",
  shortName: "APRI",
  description:
    "Non-invasive fibrosis index using AST and platelet count.",
  category: "hepatology",
  icon: "stethoscope",
  clinicalApplication:
    "Screens for significant fibrosis/cirrhosis risk in viral hepatitis and related teaching.",
  evidence: {
    version: "APRI = (AST / ULN) / platelets(10⁹/L) × 100",
    intendedPopulation: "Adults with chronic liver disease, especially viral hepatitis.",
    exclusions: [
      "Acute hepatitis flares with extreme AST",
      "Thrombocytopenia from non-hepatic causes without context",
    ],
    references: [
      {
        title: "A simple noninvasive index can predict both significant fibrosis and cirrhosis in patients with chronic hepatitis C",
        citation: "Wai CT, et al. Hepatology. 2003;38(2):518–526.",
        url: "https://pubmed.ncbi.nlm.nih.gov/12883497/",
      },
      {
        title: "WHO APRI guidance in viral hepatitis contexts",
        citation: "World Health Organization hepatitis care guidance.",
        url: "https://www.who.int/publications/i/item/9789241549981",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    { id: "ast", label: "AST", type: "number", suffix: "U/L", min: 1, max: 5000, step: 1 },
    {
      id: "uln",
      label: "AST upper limit of normal",
      type: "number",
      suffix: "U/L",
      min: 20,
      max: 80,
      step: 1,
      helpText: "Commonly 40 U/L if lab ULN unknown.",
    },
    { id: "plt", label: "Platelets", type: "number", suffix: "×10⁹/L", min: 10, max: 1000, step: 1 },
  ],
  calculate: (values) => {
    const ast = asNumber(values.ast);
    const uln = asNumber(values.uln);
    const plt = asNumber(values.plt);
    if (uln <= 0 || plt <= 0) throw new Error("ULN and platelets must be greater than zero.");
    const value = (ast / uln / plt) * 100;
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Lower fibrosis probability band (APRI ≤ 0.5)";
    if (value >= 2) {
      severity = "high";
      label = "Higher cirrhosis probability band (APRI ≥ 2.0)";
    } else if (value > 0.5) {
      severity = "moderate";
      label = "Indeterminate / significant fibrosis possible";
    }
    return formulaResult({
      value,
      digits: 2,
      label,
      severity,
      interpretation: `APRI ${roundTo(value, 2)}.`,
      clinicalSignificance:
        "Common teaching cut-offs: ≤0.5 lower likelihood of significant fibrosis; ≥1.5 or ≥2.0 higher likelihood of advanced fibrosis/cirrhosis depending on source.",
      limitations:
        "Large indeterminate zone. Performance varies by etiology and lab ULN choice.",
      details: [
        { label: "AST", value: `${ast}` },
        { label: "ULN", value: `${uln}` },
        { label: "Platelets", value: `${plt}` },
        { label: "APRI", value: `${roundTo(value, 2)}` },
      ],
      recommendations: [
        "Combine with FIB-4 and elastography pathways when available.",
        "Refer for specialist assessment if advanced fibrosis is likely.",
      ],
    });
  },
};
