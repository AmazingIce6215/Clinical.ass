import type { CalculatorDefinition, CalculatorResult } from "../types";

export const bishop: CalculatorDefinition = {
  slug: "bishop",
  title: "Bishop Score",
  shortName: "Bishop Score",
  description:
    "Predicts favourability for induction of labour and the likelihood of vaginal delivery.",
  category: "obstetrics",
  icon: "baby",
  clinicalApplication:
    "Supports structured cervical assessment before induction of labour. Interpretation should include parity, gestation, maternal and fetal status, and the local induction protocol.",
  evidence: {
    version: "Original 13-point Bishop score",
    intendedPopulation:
      "Pregnant patients undergoing cervical assessment before a planned induction of labour.",
    exclusions: [
      "Any contraindication to induction or vaginal delivery",
      "Preterm, multiple, or non-cephalic pregnancies where validation and interpretation may differ",
      "Use without obstetric assessment of maternal and fetal status",
      "Use as the sole determinant of induction method or timing",
    ],
    references: [
      {
        title: "Pelvic scoring for elective induction",
        citation: "Bishop EH. Obstet Gynecol. 1964;24:266–268.",
        url: "https://pubmed.ncbi.nlm.nih.gov/14199536/",
      },
      {
        title: "Inducing labour",
        citation: "National Institute for Health and Care Excellence. NICE guideline NG207, updated 2026.",
        url: "https://www.nice.org.uk/guidance/ng207",
      },
    ],
    reviewedAt: "2026-07-14",
  },
  inputs: [
    {
      id: "dilation",
      label: "Cervical Dilation (cm)",
      type: "select",
      options: [
        { label: "0 cm (0 pts)", value: "0", points: 0 },
        { label: "1–2 cm (1 pt)", value: "1", points: 1 },
        { label: "3–4 cm (2 pts)", value: "2", points: 2 },
        { label: "5–6 cm (3 pts)", value: "3", points: 3 },
      ],
    },
    {
      id: "effacement",
      label: "Cervical Effacement (%)",
      type: "select",
      options: [
        { label: "0–30% (0 pts)", value: "0", points: 0 },
        { label: "40–50% (1 pt)", value: "1", points: 1 },
        { label: "60–70% (2 pts)", value: "2", points: 2 },
        { label: "≥80% (3 pts)", value: "3", points: 3 },
      ],
    },
    {
      id: "station",
      label: "Fetal Station (relative to ischial spines)",
      type: "select",
      options: [
        { label: "-3 (0 pts)", value: "0", points: 0 },
        { label: "-2 (1 pt)", value: "1", points: 1 },
        { label: "-1 to 0 (2 pts)", value: "2", points: 2 },
        { label: "+1 to +2 (3 pts)", value: "3", points: 3 },
      ],
    },
    {
      id: "consistency",
      label: "Cervical Consistency",
      type: "select",
      options: [
        { label: "Firm (0 pts)", value: "0", points: 0 },
        { label: "Medium (1 pt)", value: "1", points: 1 },
        { label: "Soft (2 pts)", value: "2", points: 2 },
      ],
    },
    {
      id: "position",
      label: "Cervical Position",
      type: "select",
      options: [
        { label: "Posterior (0 pts)", value: "0", points: 0 },
        { label: "Mid-position (1 pt)", value: "1", points: 1 },
        { label: "Anterior (2 pts)", value: "2", points: 2 },
      ],
    },
  ],
  calculate: (values) => {
    const score = (Number(values.dilation) || 0) + (Number(values.effacement) || 0)
      + (Number(values.station) || 0) + (Number(values.consistency) || 0)
      + (Number(values.position) || 0);

    let severity: CalculatorResult["severity"] = "low";
    let label = "Unfavourable — consider cervical ripening";
    if (score >= 8) { severity = "low"; label = "Favourable — high success rate for IOL"; }
    else if (score >= 5) { severity = "moderate"; label = "Moderately favourable — good chance of success"; }
    else { severity = "low"; label = "Unfavourable — consider cervical ripening agents"; }

    return {
      score,
      maxScore: 13,
      severity,
      label,
      interpretation: `Bishop score ${score}/13 — ${label}.`,
      clinicalSignificance:
        score >= 8
          ? "Favourable cervix. Likelihood of vaginal delivery with induction is high. Proceed with induction as planned."
          : score >= 5
            ? "Intermediate. Ripening with prostaglandins may improve Bishop score. Reassess after induction."
            : "Unfavourable cervix. Cervical ripening recommended (PGE2 gel, balloon catheter, or misoprostol). Lower success rate for IOL; higher risk of Caesarean.",
      recommendations:
        score >= 8
          ? ["Review the planned induction approach with the obstetric team and confirm there is no contraindication.", "Discuss that a favourable score supports, but does not guarantee, vaginal delivery.", "Choose subsequent induction steps according to maternal-fetal assessment and the local protocol."]
          : score >= 5
            ? ["Review whether cervical ripening is appropriate and select a method under the local induction protocol.", "Reassess the cervix and maternal-fetal status at the interval specified by the selected method.", "Discuss the uncertainty in predicting vaginal delivery from the score alone."]
            : ["Review cervical-ripening options, contraindications, and patient preferences with the obstetric team.", "Reassess after the planned ripening course; a low score is associated with a higher chance of unsuccessful induction.", "Seek senior obstetric review if the score remains low or clinical circumstances change."],
      limitations:
        "Subjective scoring with inter-observer variability. Does not account for parity, gestational age, or other obstetric factors. Modified Bishop score is also used in some centres.",
      details: [
        { label: "Dilation", value: `${Number(values.dilation) || 0}/3` },
        { label: "Effacement", value: `${Number(values.effacement) || 0}/3` },
        { label: "Station", value: `${Number(values.station) || 0}/3` },
        { label: "Consistency", value: `${Number(values.consistency) || 0}/2` },
        { label: "Position", value: `${Number(values.position) || 0}/2` },
      ],
    };
  },
};
