import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CasePlayer } from "@/components/teaching/case-player";
import type { GeneratedTeachingCase } from "@/lib/types";

const push = jest.fn();
const logAttempt = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/lib/case-library", () => ({
  isInLibrary: () => false,
  markDiseaseSeen: jest.fn(),
  markTitleSeen: jest.fn(),
  markVignettesSeen: jest.fn(),
  removeFromLibrary: jest.fn(),
  saveTeachingToLibrary: jest.fn(),
}));

jest.mock("@/lib/teaching-stats", () => ({
  logAttempt: (...args: unknown[]) => logAttempt(...args),
}));

const teachingCase: GeneratedTeachingCase = {
  id: "case-1",
  title: "Acute breathlessness",
  subject: "internal-medicine",
  subjectName: "Internal Medicine",
  difficulty: "medium",
  vignette: "A patient presents with acute breathlessness.",
  generatedAt: 1,
  questions: [
    {
      id: "question-1",
      patientLabel: "Patient 1",
      vignette: "A 68-year-old reports sudden breathlessness and pleuritic chest pain.",
      prompt: "What is the single best next investigation?",
      options: ["CT pulmonary angiography", "Routine spirometry", "Skin-prick testing"],
      correctIndex: 0,
      explanation: "The presentation requires prompt investigation for pulmonary embolism.",
      optionExplanations: [
        "This directly evaluates the leading diagnosis.",
        "This is not appropriate during the acute presentation.",
        "This does not address the immediate concern.",
      ],
      teachingPearl: "Match the urgency of the investigation to the acuity of the presentation.",
    },
  ],
};

describe("CasePlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("labels generated content and exposes formative feedback after submission", async () => {
    const user = userEvent.setup();
    render(<CasePlayer teachingCase={teachingCase} />);

    expect(screen.getByText("AI-generated case")).toBeInTheDocument();
    expect(screen.getByText("Patient information")).toBeInTheDocument();

    await user.click(
      screen.getByRole("radio", { name: /CT pulmonary angiography/i }),
    );
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(screen.getByText("Formative feedback")).toBeInTheDocument();
    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByText("Answer explanation")).toBeInTheDocument();
    expect(logAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: "question-1",
        correct: true,
        userAnswer: 0,
      }),
    );
  });

  it("provides an accessible save control", () => {
    render(<CasePlayer teachingCase={teachingCase} />);

    const saveButton = screen.getByRole("button", { name: "Save case to library" });
    expect(saveButton).toHaveAttribute("aria-pressed", "false");
    expect(saveButton).toHaveClass("min-h-11", "min-w-11");
  });
});
