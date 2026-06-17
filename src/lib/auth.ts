import { createClient } from "@/lib/supabase/client";

export interface ProfileCheck {
  exists: boolean;
  hasPin: boolean;
}

export interface AuthSession {
  userId: string;
  firstName: string;
  createdAt: number;
}

interface StoredProfile {
  id: string;
  firstName: string;
  pinHash: string | null;
  createdAt: number;
}

const PROFILES_KEY = "clincalass-profiles";
const SESSION_KEY = "clincalass-session";
const LEGACY_USERS_KEY = "dxflow-users";
const LEGACY_SESSION_KEY = "dxflow-session";

function isSupabaseConfigured(): boolean {
  if (typeof window === "undefined") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  return !url.includes("your-project-id");
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

function getProfiles(): StoredProfile[] {
  return readJson<StoredProfile[]>(PROFILES_KEY, []);
}

function saveProfiles(profiles: StoredProfile[]) {
  writeJson(PROFILES_KEY, profiles);
}

async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(`clincalass-pin:${pin}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function checkProfile(firstName: string): Promise<ProfileCheck> {
  const name = normalizeName(firstName);

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("pin_hash, first_name");

    const profile = data?.find(
      (p: { first_name: string; pin_hash: string | null }) =>
        p.first_name.toLowerCase() === name.toLowerCase(),
    );

    if (profile) {
      return { exists: true, hasPin: profile.pin_hash !== null };
    }
    return { exists: false, hasPin: false };
  }

  const profiles = getProfiles();
  const profile = profiles.find((p) => p.firstName.toLowerCase() === name.toLowerCase());
  if (profile) {
    return { exists: true, hasPin: Boolean(profile.pinHash) };
  }
  return { exists: false, hasPin: false };
}

export async function getSession(): Promise<AuthSession | null> {
  if (isSupabaseConfigured()) {
    const sessionId = readJson<string | null>(SESSION_KEY, null);
    if (sessionId) {
      const supabase = createClient();
      const result = await supabase
        .from("profiles")
        .select("id, first_name, created_at")
        .eq("id", sessionId);
      if (result.data && result.data.length > 0) {
        const profile = result.data[0] as { id: string; first_name: string; created_at: string };
        return {
          userId: profile.id,
          firstName: profile.first_name,
          createdAt: new Date(profile.created_at).getTime(),
        };
      }
    }
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
  pin: string,
): Promise<{ session?: AuthSession; error?: string }> {
  const name = normalizeName(firstName);
  if (name.length < 2) return { error: "Enter your first name (at least 2 letters)." };
  if (!pin || !/^\d{4}$/.test(pin)) return { error: "PIN must be exactly 4 digits." };

  const capitalized = capitalizeName(name);

  if (isSupabaseConfigured()) {
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("first_name", capitalized);

    if (existing && existing.length > 0) {
      return { error: `"${capitalized}" already has a profile. Switch to unlock below.` };
    }

    const id = crypto.randomUUID();
    const pinHash = pin ? await hashPin(pin) : null;

    const { error } = await supabase.from("profiles").insert({
      id,
      first_name: capitalized,
      pin_hash: pinHash,
    });

    if (error) {
      if (error.message.includes("unique constraint") || error.code === "23505") {
        return { error: `"${capitalized}" is already taken. Try unlocking instead.` };
      }
      return { error: error.message };
    }

    writeJson(SESSION_KEY, id);
    return {
      session: {
        userId: id,
        firstName: capitalized,
        createdAt: Date.now(),
      },
    };
  }

  const profiles = getProfiles();
  const exists = profiles.some((p) => p.firstName.toLowerCase() === name.toLowerCase());
  if (exists) return { error: "That name is taken on this device. Switch profile instead." };

  const profile: StoredProfile = {
    id: crypto.randomUUID(),
    firstName: capitalizeName(name),
    pinHash: pin ? await hashPin(pin) : null,
    createdAt: Date.now(),
  };
  saveProfiles([...profiles, profile]);

  const session: AuthSession = {
    userId: profile.id,
    firstName: profile.firstName,
    createdAt: profile.createdAt,
  };
  writeJson(SESSION_KEY, session);
  return { session };
}

export async function unlockProfile(
  firstName: string,
  pin?: string,
): Promise<{ session?: AuthSession; error?: string; needsPin?: boolean }> {
  const name = normalizeName(firstName);

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, first_name, pin_hash, created_at");

    if (error) return { error: error.message };

    const profile = profiles.find(
      (p) => p.first_name.toLowerCase() === name.toLowerCase(),
    );

    if (!profile) return { error: "Incorrect username or PIN." };

    if (profile.pin_hash) {
      if (!pin) return { needsPin: true, error: "Enter your PIN." };
      if (!/^\d{4}$/.test(pin)) return { error: "PIN must be 4 digits." };
      const candidate = await hashPin(pin);
      if (candidate !== profile.pin_hash) return { error: "Incorrect username or PIN." };
    }

    writeJson(SESSION_KEY, profile.id);
    return {
      session: {
        userId: profile.id,
        firstName: profile.first_name,
        createdAt: new Date(profile.created_at).getTime(),
      },
    };
  }

  const profiles = getProfiles();
  const profile = profiles.find((p) => p.firstName.toLowerCase() === name.toLowerCase());
  if (!profile) return { error: "Incorrect username or PIN." };

  if (profile.pinHash) {
    if (!pin) return { needsPin: true, error: "Enter your PIN." };
    if (!/^\d{4}$/.test(pin)) return { error: "PIN must be 4 digits." };
    const candidate = await hashPin(pin);
    if (candidate !== profile.pinHash) return { error: "Incorrect username or PIN." };
  }

  const session: AuthSession = {
    userId: profile.id,
    firstName: profile.firstName,
    createdAt: profile.createdAt,
  };
  writeJson(SESSION_KEY, session);
  return { session };
}

export async function logoutUser() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

export function listProfiles() {
  return getProfiles().map((p) => ({
    id: p.id,
    firstName: p.firstName,
    hasPin: Boolean(p.pinHash),
    createdAt: p.createdAt,
  }));
}

export function deleteProfile(id: string) {
  const remaining = getProfiles().filter((p) => p.id !== id);
  saveProfiles(remaining);
  const current = readJson<AuthSession | null>(SESSION_KEY, null);
  if (current?.userId === id) logoutUser();
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const nightGreetings = ["hello night owl", "hey night owl", "late night?", "moonlit study"];
const morningGreetings = ["good morning", "morning early bird", "rise and shine", "morning"];
const afternoonGreetings = ["good afternoon", "afternoon", "hello there", "nice afternoon"];
const eveningGreetings = ["good evening", "evening", "hey there", "evening vibes"];

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
