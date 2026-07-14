/** @jest-environment node */

const exchangeCodeForSession = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: { exchangeCodeForSession },
  })),
}));

import { GET } from "../route";

describe("Supabase auth callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
  });

  it("exchanges a PKCE code and redirects to a safe internal path", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(new Request(
      "https://orizon.test/auth/callback?code=valid-code&next=%2Fsettings%3Fpassword-reset%3D1",
    ));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://orizon.test/settings?password-reset=1");
  });

  it("does not allow an external redirect target", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(new Request(
      "https://orizon.test/auth/callback?code=valid-code&next=%2F%2Fevil.example",
    ));

    expect(response.headers.get("location")).toBe("https://orizon.test/dashboard");
  });

  it("returns an actionable sign-in error when exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("expired") });

    const response = await GET(new Request("https://orizon.test/auth/callback?code=expired"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/sign-in?error=");
  });
});
