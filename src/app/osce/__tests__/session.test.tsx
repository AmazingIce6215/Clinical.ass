import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OsceSession } from "@/app/osce/session";
import type { OsceSessionState } from "@/lib/osce/state";

jest.mock("@/lib/voice", () => ({
  warmVoiceCache: jest.fn(),
  speakNatural: jest.fn(),
  stopSpeaking: jest.fn(),
  stopNaturalVoice: jest.fn(),
  isSpeechSynthesisSupported: () => false,
}));

const session: OsceSessionState = {
  caseId: "osce-1",
  casePresentation: "I have had chest pain since this morning.",
  caseFullDetails: "Generated case details",
  patientSex: "female",
  difficulty: "medium",
  timeRemaining: 480,
  duration: 480,
  questionsAsked: [],
  missedKeyPoints: [],
  differentialAttempted: [],
  managementAttempted: [],
  riskFlags: [],
  startTime: 1,
  status: "active",
  conversation: [
    { role: "patient", content: "I have had chest pain since this morning." },
  ],
};

describe("OsceSession", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: jest.fn(),
    });
  });

  it("exposes timer and transcript semantics and keeps typed interviewing functional", async () => {
    const user = userEvent.setup();
    const onMessage = jest.fn().mockResolvedValue("No, the pain does not spread.");
    const onSubmit = jest.fn();

    render(
      <OsceSession
        session={session}
        onMessage={onMessage}
        onSubmit={onSubmit}
        onBack={jest.fn()}
      />,
    );

    const timer = screen.getByRole("timer", { name: /8 minutes and 0 seconds remaining/i });
    expect(timer).toHaveTextContent("08:00");
    expect(screen.getByRole("log", { name: "Patient interview transcript" })).toBeInTheDocument();
    expect(screen.getByText("AI-generated simulated patient")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Question for the simulated patient"),
      "Does the pain spread anywhere?",
    );
    await user.click(screen.getByRole("button", { name: "Send question" }));

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith("Does the pain spread anywhere?");
      expect(screen.getByText("No, the pain does not spread.")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Finish station" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
