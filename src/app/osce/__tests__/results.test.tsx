import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { OsceResults } from "@/app/osce/results";
import type { OsceGradeResult } from "@/lib/osce/state";

const grade: OsceGradeResult = {
  score: 74,
  breakdown: {
    history: 30,
    differential: 15,
    investigations: 14,
    management: 15,
  },
  clinicalReasoning: "The interview followed a structured symptom analysis.",
  critical_mistakes: ["Medication allergies were not confirmed."],
  missed_red_flags: ["Syncope was not explored."],
  examiner_feedback: ["Use a clearer transition into the past medical history."],
  model_answer: {
    history: ["Clarify onset and associated symptoms."],
    differential: ["Consider pulmonary embolism."],
    investigations: ["Request an ECG."],
    management: ["Escalate if the patient is unstable."],
  },
};

describe("OsceResults", () => {
  it("presents automated scoring as formative rather than authoritative", () => {
    render(<OsceResults grade={grade} onReset={jest.fn()} />);

    expect(screen.getByText("AI-generated formative feedback")).toBeInTheDocument();
    expect(screen.getByText("Practice benchmark met")).toBeInTheDocument();
    expect(
      screen.getByText(/not a validated examination result/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Suggested response outline")).toBeInTheDocument();
    expect(screen.queryByText("Model Answer")).not.toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")).toHaveLength(4);
  });
});
