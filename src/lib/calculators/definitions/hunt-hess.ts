import type { CalculatorDefinition } from "../types";
import { scoreResult } from "../helpers";

export const huntHess: CalculatorDefinition = {
  slug: "hunt-hess",
  title: "Hunt and Hess Grade (SAH)",
  shortName: "Hunt-Hess",
  description:
    "Clinical grading scale for subarachnoid haemorrhage severity and surgical risk discussion.",
  category: "neurology",
  icon: "brain",
  clinicalApplication:
    "Describes SAH clinical severity at presentation. Complements WFNS and Fisher grades.",
  evidence: {
    version: "Hunt and Hess grades I–V",
    intendedPopulation: "Adults with aneurysmal SAH clinical grading.",
    exclusions: [
      "Non-aneurysmal thunderclap headache without SAH diagnosis",
      "Sole determinant of treatment futility",
    ],
    references: [
      {
        title: "Surgical risk as related to time of intervention in the repair of intracranial aneurysms",
        citation: "Hunt WE, Hess RM. J Neurosurg. 1968;28(1):14–20.",
        url: "https://pubmed.ncbi.nlm.nih.gov/5635959/",
      },
      {
        title: "SAH grading systems review context",
        citation: "Report of World Federation of Neurological Surgeons Committee on a Universal Subarachnoid Hemorrhage Grading Scale.",
        url: "https://pubmed.ncbi.nlm.nih.gov/3412596/",
      },
    ],
    reviewedAt: "2026-07-15",
  },
  inputs: [
    {
      id: "grade",
      label: "Hunt–Hess grade",
      type: "select",
      options: [
        { label: "I — Asymptomatic / mild headache / slight nuchal rigidity", value: "1", points: 1 },
        { label: "II — Moderate–severe headache, nuchal rigidity, no deficit other than CN palsy", value: "2", points: 2 },
        { label: "III — Drowsiness / confusion / mild focal deficit", value: "3", points: 3 },
        { label: "IV — Stupor, moderate–severe hemiparesis, early decerebrate", value: "4", points: 4 },
        { label: "V — Deep coma, decerebrate rigidity, moribund", value: "5", points: 5 },
      ],
    },
  ],
  calculate: (values) => {
    const score = Number(values.grade) || 1;
    const severity =
      score <= 2 ? "moderate" : score === 3 ? "high" : "critical";
    return scoreResult({
      score,
      maxScore: 5,
      label: `Hunt–Hess grade ${score}`,
      severity,
      interpretation: `Hunt and Hess grade ${score}/5.`,
      clinicalSignificance:
        "Higher grades associate with higher mortality and poorer outcomes after aneurysmal SAH.",
      limitations:
        "Inter-observer variability. WFNS (GCS-based) is often preferred in research.",
      recommendations: [
        "Urgent neurosurgical/neurovascular referral for confirmed SAH.",
        "Manage BP, reverse anticoagulation, and prevent rebleeding per local protocol.",
      ],
    });
  },
};
