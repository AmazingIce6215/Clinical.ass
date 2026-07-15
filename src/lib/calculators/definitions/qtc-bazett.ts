import type { CalculatorDefinition } from "../types";
import { asNumber, formulaResult, roundTo } from "../helpers";

export const qtcBazett: CalculatorDefinition = {
  slug: "qtc-bazett",
  title: "Corrected QT Interval (Bazett)",
  shortName: "QTc",
  description:
    "Corrects the QT interval for heart rate using Bazett’s formula.",
  category: "cardiology",
  icon: "heart-pulse",
  clinicalApplication:
    "Educational QTc estimate for drug safety and arrhythmia risk discussion. Confirm automated ECG measurements.",
  evidence: {
    version: "Bazett QTc = QT / √RR",
    intendedPopulation: "Adults with measurable QT and RR intervals on ECG.",
    exclusions: [
      "Marked irregular rhythms where single RR is unreliable",
      "Wide QRS without adjustment methods",
      "Sole determinant of drug dosing without clinical context",
    ],
    references: [
      {
        title: "An analysis of the time-relations of electrocardiograms",
        citation: "Bazett HC. Heart. 1920;7:353–370.",
        url: "https://doi.org/10.1111/j.1469-185X.1920.tb00105.x",
      },
      {
        title: "Prevention of torsade de pointes in hospital settings",
        citation: "Drew BJ, et al. Circulation. 2010;121(8):1047–1060.",
        url: "https://pubmed.ncbi.nlm.nih.gov/20142454/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "qt",
      label: "QT interval",
      type: "number",
      suffix: "ms",
      min: 200,
      max: 800,
      step: 1,
    },
    {
      id: "hr",
      label: "Heart rate",
      type: "number",
      suffix: "/min",
      min: 30,
      max: 220,
      step: 1,
      helpText: "Alternatively ensure RR is consistent with this rate.",
    },
  ],
  calculate: (values) => {
    const qt = asNumber(values.qt);
    const hr = asNumber(values.hr);
    if (hr <= 0) throw new Error("Heart rate must be greater than zero.");
    const rrSec = 60 / hr;
    const qtc = qt / Math.sqrt(rrSec);

    let severity: "low" | "moderate" | "high" | "severe" = "low";
    let label = "QTc within common reference band";
    if (qtc >= 500) {
      severity = "severe";
      label = "Markedly prolonged QTc band (≥500 ms)";
    } else if (qtc >= 480) {
      severity = "high";
      label = "Prolonged QTc band";
    } else if (qtc >= 450) {
      severity = "moderate";
      label = "Borderline / sex-dependent prolonged band";
    } else if (qtc < 350) {
      severity = "moderate";
      label = "Short QTc band";
    }

    return formulaResult({
      value: qtc,
      unit: "ms",
      digits: 0,
      label,
      severity,
      interpretation: `Bazett QTc ≈ ${roundTo(qtc, 0)} ms (QT ${qt} ms at HR ${hr}/min).`,
      clinicalSignificance:
        "Prolonged QTc raises concern for torsades risk, especially with QT-prolonging drugs or electrolyte abnormalities.",
      limitations:
        "Bazett overcorrects at high HR and undercorrects at low HR. Fridericia may be preferred in some settings.",
      details: [
        { label: "QT", value: `${qt} ms` },
        { label: "HR", value: `${hr}/min` },
        { label: "RR", value: `${roundTo(rrSec * 1000, 0)} ms` },
        { label: "QTc (Bazett)", value: `${roundTo(qtc, 0)} ms` },
      ],
      recommendations: [
        "Recheck electrolytes (K, Mg, Ca) and drug list if QTc is prolonged.",
        "Repeat ECG manually if automated QT looks inconsistent with the tracing.",
      ],
    });
  },
};
