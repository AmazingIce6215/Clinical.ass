import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

export interface ProfileCheck {
  exists: boolean;
  hasPin: boolean;
}

export interface AuthSession {
  userId: string;
  firstName: string;
  email?: string;
  createdAt: number;
}

interface StoredProfile {
  id: string;
  firstName: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

const SESSION_KEY = "clincalass-session";
const LOCAL_PROFILES_KEY = "clincalass-local-profiles";
const LEGACY_SESSION_KEY = "dxflow-session";

function isSupabaseConfigured(): boolean {
  if (typeof window === "undefined") return false;
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey && !url.includes("your-project-id") && !url.includes("placeholder"));
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function capitalizeName(name: string): string {
  return normalizeName(name)
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getLocalProfiles(): StoredProfile[] {
  return readJson<StoredProfile[]>(LOCAL_PROFILES_KEY, []);
}

function saveLocalProfiles(profiles: StoredProfile[]) {
  writeJson(LOCAL_PROFILES_KEY, profiles);
}

async function hashSecret(value: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(`clinicalass:${value}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function mapAuthError(message: string): string {
  if (!message) return "Something went wrong. Please try again.";
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Wrong email or password.";
  }
  if (message.toLowerCase().includes("email") && message.toLowerCase().includes("confirmed")) {
    return "Please confirm your email before signing in.";
  }
  return message;
}

export function shouldIgnoreProfileError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("relation \"profiles\" does not exist") ||
    normalized.includes("permission denied for table profiles") ||
    normalized.includes("permission denied for relation profiles") ||
    normalized.includes("new row violates row-level security policy") ||
    normalized.includes("violates row-level security policy")
  );
}

export function normalizeAuthResult(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object") {
    const maybeError = (result as { error?: unknown }).error;
    if (typeof maybeError === "string" && maybeError.trim()) return maybeError;
  }
  return "We couldn’t complete that request. Please try again.";
}

function buildSession(user: {
  id: string;
  email?: string | null;
  first_name?: string | null;
  created_at?: string | null;
}) {
  return {
    userId: user.id,
    firstName: user.first_name?.trim() || user.email?.split("@")[0] || "Student",
    email: user.email ?? undefined,
    createdAt: user.created_at ? new Date(user.created_at).getTime() : Date.now(),
  } satisfies AuthSession;
}

export async function checkProfile(email: string): Promise<ProfileCheck> {
  const normalized = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("id").ilike("email", normalized).maybeSingle();
    return { exists: Boolean(data), hasPin: false };
  }

  const profiles = getLocalProfiles();
  const profile = profiles.find((p) => p.email.toLowerCase() === normalized);
  return { exists: Boolean(profile), hasPin: false };
}

export function createAnonymousSession(): AuthSession {
  const session: AuthSession = {
    userId: crypto.randomUUID(),
    firstName: "",
    createdAt: Date.now(),
  };
  writeJson(SESSION_KEY, session);
  return session;
}

export async function getSession(): Promise<AuthSession | null> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error) return null;

    const authUser = sessionData.session?.user;
    if (!authUser) {
      const session = readJson<AuthSession | null>(SESSION_KEY, null);
      if (session) return session;
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, created_at")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!profileError && profile) {
      const session = buildSession({
        id: authUser.id,
        email: profile.email ?? authUser.email,
        first_name: profile.first_name,
        created_at: profile.created_at,
      });
      writeJson(SESSION_KEY, session);
      return session;
    }

    const fallback = buildSession({
      id: authUser.id,
      email: authUser.email,
      first_name: (authUser.user_metadata?.first_name as string | undefined) ?? undefined,
      created_at: authUser.created_at,
    });
    writeJson(SESSION_KEY, fallback);
    return fallback;
  }

  const session = readJson<AuthSession | null>(SESSION_KEY, null);
  if (session) return session;

  const legacy = readJson<AuthSession | null>(LEGACY_SESSION_KEY, null);
  if (legacy) {
    writeJson(SESSION_KEY, legacy);
    if (typeof window !== "undefined") localStorage.removeItem(LEGACY_SESSION_KEY);
  }
  return legacy;
}

export async function createProfile(
  firstName: string,
  email: string,
  password: string,
): Promise<{ session?: AuthSession; error?: string }> {
  const name = normalizeName(firstName);
  const normalizedEmail = email.trim().toLowerCase();

  if (name.length < 2) return { error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: "Please enter a valid email address." };
  }
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          first_name: capitalizeName(name),
        },
      },
    });

    if (error) return { error: mapAuthError(error.message) };

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: normalizedEmail,
          first_name: capitalizeName(name),
        },
        { onConflict: "id" },
      );

      if (profileError && !shouldIgnoreProfileError(profileError.message)) {
        return { error: profileError.message };
      }

      const session = buildSession({
        id: data.user.id,
        email: data.user.email,
        first_name: capitalizeName(name),
        created_at: data.user.created_at,
      });
      writeJson(SESSION_KEY, session);
      return { session };
    }

    return {
      error: "Account created. Please check your inbox to confirm your email, then sign in.",
    };
  }

  const profiles = getLocalProfiles();
  const exists = profiles.some((p) => p.email.toLowerCase() === normalizedEmail);
  if (exists) {
    return { error: "An account already exists for that email on this device." };
  }

  const profile: StoredProfile = {
    id: crypto.randomUUID(),
    firstName: capitalizeName(name),
    email: normalizedEmail,
    passwordHash: await hashSecret(password),
    createdAt: Date.now(),
  };
  saveLocalProfiles([...profiles, profile]);

  const session: AuthSession = {
    userId: profile.id,
    firstName: profile.firstName,
    email: normalizedEmail,
    createdAt: profile.createdAt,
  };
  writeJson(SESSION_KEY, session);
  return { session };
}

export async function unlockProfile(
  email: string,
  password: string,
): Promise<{ session?: AuthSession; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) return { error: mapAuthError(error.message) };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, created_at")
      .eq("id", data.user.id)
      .maybeSingle();

    const session = buildSession({
      id: data.user.id,
      email: !profileError && profile?.email ? profile.email : data.user.email,
      first_name: !profileError && profile?.first_name ? profile.first_name : (data.user.user_metadata?.first_name as string | undefined),
      created_at: !profileError && profile?.created_at ? profile.created_at : data.user.created_at,
    });
    writeJson(SESSION_KEY, session);
    return { session };
  }

  const profiles = getLocalProfiles();
  const profile = profiles.find((p) => p.email.toLowerCase() === normalizedEmail);
  if (!profile) return { error: "No account found for that email." };
  const candidate = await hashSecret(password);
  if (candidate !== profile.passwordHash) return { error: "Wrong email or password." };

  const session: AuthSession = {
    userId: profile.id,
    firstName: profile.firstName,
    email: profile.email,
    createdAt: profile.createdAt,
  };
  writeJson(SESSION_KEY, session);
  return { session };
}

export async function updateProfile(data: {
  first_name?: string;
  email?: string;
  pin?: string;
}): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not logged in." };

  if (isSupabaseConfigured()) {
    const supabase = createClient();

    const updates: Record<string, unknown> = {};
    if (data.first_name) {
      const name = normalizeName(data.first_name);
      if (name.length < 2) return { error: "Name must be at least 2 characters." };
      updates.first_name = capitalizeName(name);
    }

    if (data.email) {
      const normalizedEmail = data.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { error: "Please enter a valid email address." };
      }
      updates.email = normalizedEmail;
    }

    if (Object.keys(updates).length === 0) return {};

    const { error } = await supabase.from("profiles").update(updates).eq("id", session.userId);
    if (error) {
      if (shouldIgnoreProfileError(error.message)) return {};
      return { error: error.message };
    }
  }

  return {};
}

export async function getProfileCreatedAt(firstName: string): Promise<string | null> {
  void firstName;
  return null;
}

export async function resetPin(email: string): Promise<{ error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (error) return { error: mapAuthError(error.message) };
    return {};
  }

  return { error: "Password-reset email is not available for device-local accounts." };
}

export async function logoutUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
}

export function listProfiles() {
  return getLocalProfiles().map((p) => ({
    id: p.id,
    firstName: p.firstName,
    email: p.email,
    createdAt: p.createdAt,
  }));
}

export function deleteProfile(id: string) {
  const remaining = getLocalProfiles().filter((p) => p.id !== id);
  saveLocalProfiles(remaining);
  const current = readJson<AuthSession | null>(SESSION_KEY, null);
  if (current?.userId === id) logoutUser();
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const nightGreetings = ["good evening"];
const morningGreetings = ["good morning"];
const afternoonGreetings = ["good afternoon"];
const eveningGreetings = ["good evening"];

function selectGreeting(hour: number): string {
  if (hour >= 22 || hour < 5) return randomItem(nightGreetings);
  if (hour < 9) return randomItem(morningGreetings);
  if (hour < 17) return randomItem(afternoonGreetings);
  return randomItem(eveningGreetings);
}

export function getPersonalGreeting(firstName = ""): string {
  const name = firstName.trim();
  const greeting = selectGreeting(new Date().getHours());
  if (!name) return greeting;
  return `${greeting}, ${name}`;
}
