import { getSupabaseEnv } from "../env";

describe("getSupabaseEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("accepts the publishable key when no anon key is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";

    expect(getSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "sb_publishable_test",
    });
  });
});
