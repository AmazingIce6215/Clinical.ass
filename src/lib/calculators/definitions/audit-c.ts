import type { CalculatorDefinition } from "../types";
import { scoreResult, sumSelectPoints } from "../helpers";

export const auditC: CalculatorDefinition = {
  slug: "audit-c",
  title: "AUDIT-C Alcohol Screening",
  shortName: "AUDIT-C",
  description:
    "Three-item alcohol use screening questionnaire derived from AUDIT.",
  category: "mental-health",
  icon: "pill",
  clinicalApplication:
    "Brief screening for hazardous drinking in primary and hospital care.",
  evidence: {
    version: "AUDIT-C (Bush)",
    intendedPopulation: "Adults screened for alcohol misuse in clinical settings.",
    exclusions: [
      "Sole diagnosis of alcohol use disorder without full assessment",
      "Acute intoxication management",
    ],
    references: [
      {
        title: "The AUDIT alcohol consumption questions (AUDIT-C)",
        citation: "Bush K, et al. Arch Intern Med. 1998;158(16):1789–1795.",
        url: "https://pubmed.ncbi.nlm.nih.gov/9738608/",
      },
      {
        title: "AUDIT guidelines for use in primary care",
        citation: "Babor TF, et al. WHO. 2001.",
        url: "https://www.who.int/publications/i/item/audit-the-alcohol-use-disorders-identification-test-guidelines-for-use-in-primary-health-care",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "freq",
      label: "How often do you have a drink containing alcohol?",
      type: "select",
      options: [
        { label: "Never (0)", value: "0", points: 0 },
        { label: "Monthly or less (1)", value: "1", points: 1 },
        { label: "2–4 times a month (2)", value: "2", points: 2 },
        { label: "2–3 times a week (3)", value: "3", points: 3 },
        { label: "4 or more times a week (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "typical",
      label: "How many standard drinks on a typical day when drinking?",
      type: "select",
      options: [
        { label: "1–2 (0)", value: "0", points: 0 },
        { label: "3–4 (1)", value: "1", points: 1 },
        { label: "5–6 (2)", value: "2", points: 2 },
        { label: "7–9 (3)", value: "3", points: 3 },
        { label: "10 or more (4)", value: "4", points: 4 },
      ],
    },
    {
      id: "binge",
      label: "How often ≥6 drinks on one occasion?",
      type: "select",
      options: [
        { label: "Never (0)", value: "0", points: 0 },
        { label: "Less than monthly (1)", value: "1", points: 1 },
        { label: "Monthly (2)", value: "2", points: 2 },
        { label: "Weekly (3)", value: "3", points: 3 },
        { label: "Daily or almost daily (4)", value: "4", points: 4 },
      ],
    },
  ],
  calculate: (values) => {
    const score = sumSelectPoints(values, auditC.inputs);
    let severity: "low" | "moderate" | "high" = "low";
    let label = "Lower-risk screening band";
    // Common cut-offs: ≥4 men, ≥3 women — we use ≥3 as sensitive screen
    if (score >= 6) {
      severity = "high";
      label = "Higher-risk hazardous drinking band";
    } else if (score >= 3) {
      severity = "moderate";
      label = "Positive screen — further assessment often indicated";
    }
    return scoreResult({
      score,
      maxScore: 12,
      label,
      severity,
      interpretation: `AUDIT-C ${score}/12.`,
      clinicalSignificance:
        "Positive screens warrant brief intervention and consideration of full AUDIT or clinical assessment; cut-offs differ by sex and setting.",
      limitations:
        "Self-report underestimation is common. Not a withdrawal severity tool (use CIWA-Ar).",
      recommendations:
        score >= 3
          ? [
              "Offer brief advice and assess for dependence features.",
              "Consider full AUDIT, LFTs, and specialist referral when indicated.",
            ]
          : [
              "Reinforce lower-risk drinking guidance.",
              "Re-screen periodically or if clinical concern arises.",
            ],
    });
  },
};
