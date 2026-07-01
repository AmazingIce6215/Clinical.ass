import { normalizeAuthResult, shouldIgnoreProfileError } from "../auth";

describe("shouldIgnoreProfileError", () => {
  it("ignores missing profile table errors", () => {
    expect(shouldIgnoreProfileError("relation \"profiles\" does not exist")).toBe(true);
  });

  it("ignores permission errors for the profile table", () => {
    expect(shouldIgnoreProfileError("permission denied for table profiles")).toBe(true);
  });

  it("does not ignore unexpected database errors", () => {
    expect(shouldIgnoreProfileError("network request failed")).toBe(false);
  });

  it("normalizes empty object responses into a friendly fallback message", () => {
    expect(normalizeAuthResult({})).toBe("We couldn’t complete that request. Please try again.");
  });
});
