import {
  createAnonymousSession,
  getAuthCallbackUrl,
  getSession,
  normalizeAuthResult,
  shouldIgnoreProfileError,
  updateProfile,
} from "../auth";

beforeEach(() => {
  localStorage.clear();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
});

describe("shouldIgnoreProfileError", () => {
  it("ignores missing profile table errors", () => {
    expect(shouldIgnoreProfileError("relation \"profiles\" does not exist")).toBe(true);
  });

  it("does not hide permission or row-level security errors", () => {
    expect(shouldIgnoreProfileError("permission denied for table profiles")).toBe(false);
    expect(shouldIgnoreProfileError("new row violates row-level security policy")).toBe(false);
  });

  it("does not ignore unexpected database errors", () => {
    expect(shouldIgnoreProfileError("network request failed")).toBe(false);
  });

  it("normalizes empty object responses into a friendly fallback message", () => {
    expect(normalizeAuthResult({})).toBe("We couldn’t complete that request. Please try again.");
  });
});

describe("session safety", () => {
  it("marks guest sessions explicitly and persists profile changes locally", async () => {
    const session = createAnonymousSession();
    expect(session.accountType).toBe("guest");

    await expect(updateProfile({ first_name: "alex learner" })).resolves.toEqual({});
    await expect(getSession()).resolves.toMatchObject({
      userId: session.userId,
      firstName: "Alex Learner",
      accountType: "guest",
    });
  });

  it("builds same-origin callback URLs and rejects external next paths", () => {
    expect(getAuthCallbackUrl("/settings?password-reset=1")).toBe(
      `${window.location.origin}/auth/callback?next=%2Fsettings%3Fpassword-reset%3D1`,
    );
    expect(getAuthCallbackUrl("//example.com/steal")).toBe(
      `${window.location.origin}/auth/callback?next=%2Fdashboard`,
    );
  });
});
