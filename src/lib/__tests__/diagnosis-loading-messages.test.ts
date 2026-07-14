import { pickDiagnosisLoadingMessage } from "../diagnosis-loading-messages";

describe("pickDiagnosisLoadingMessage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses factual clinical-review language", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);

    expect(pickDiagnosisLoadingMessage({})).toBe(
      "Reviewing the recorded history and examination findings.",
    );
  });

  it("does not place a patient identifier in rotating status copy", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const message = pickDiagnosisLoadingMessage({
      patientName: "Jane Example",
      complaints: ["chest pain"],
    });

    expect(message).not.toContain("Jane Example");
    expect(message).not.toMatch(/panic|guess|caffeine|consultant|google/i);
  });

  it("avoids immediately repeating the previous stage", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const previous = "Reviewing the recorded history and examination findings.";

    expect(pickDiagnosisLoadingMessage({ exclude: previous })).not.toBe(previous);
  });
});
