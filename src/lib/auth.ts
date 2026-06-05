export interface AuthSession {
  userId: string;
  firstName: string;
}

interface StoredUser {
  id: string;
  firstName: string;
  passwordHash: string;
  salt: string;
}

const USERS_KEY = "clincalass-users";
const SESSION_KEY = "clincalass-session";
const LEGACY_USERS_KEY = "dxflow-users";
const LEGACY_SESSION_KEY = "dxflow-session";

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

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  return crypto.randomUUID();
}

function getUsers(): StoredUser[] {
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  if (users.length > 0) return users;

  const legacy = readJson<StoredUser[]>(LEGACY_USERS_KEY, []);
  if (legacy.length > 0) {
    saveUsers(legacy);
    if (typeof window !== "undefined") localStorage.removeItem(LEGACY_USERS_KEY);
  }
  return legacy;
}

function saveUsers(users: StoredUser[]) {
  writeJson(USERS_KEY, users);
}

function migrateLegacyData(userId: string) {
  const suffixes = [
    "library",
    "seen-diseases",
    "seen-titles",
    "seen-vignettes",
    "favorites",
    "seen-cases",
  ];

  for (const suffix of suffixes) {
    const newKey = `clincalass-${suffix}`;
    const scoped = `${newKey}-${userId}`;
    if (localStorage.getItem(scoped)) continue;

    for (const prefix of ["clincalass", "dxflow"]) {
      const legacyScoped = localStorage.getItem(`${prefix}-${suffix}-${userId}`);
      if (legacyScoped) {
        localStorage.setItem(scoped, legacyScoped);
        localStorage.removeItem(`${prefix}-${suffix}-${userId}`);
        break;
      }

      const legacy = localStorage.getItem(`${prefix}-${suffix}`);
      if (legacy) {
        localStorage.setItem(scoped, legacy);
        localStorage.removeItem(`${prefix}-${suffix}`);
        break;
      }
    }
  }
}

export function getSession(): AuthSession | null {
  const session = readJson<AuthSession | null>(SESSION_KEY, null);
  if (session) return session;

  const legacy = readJson<AuthSession | null>(LEGACY_SESSION_KEY, null);
  if (legacy) {
    writeJson(SESSION_KEY, legacy);
    if (typeof window !== "undefined") localStorage.removeItem(LEGACY_SESSION_KEY);
  }
  return legacy;
}

export async function registerUser(
  firstName: string,
  password: string,
): Promise<{ session?: AuthSession; error?: string }> {
  const name = normalizeName(firstName);
  if (name.length < 2) return { error: "Enter your first name." };
  if (password.length < 4) return { error: "Password must be at least 4 characters." };

  const users = getUsers();
  const exists = users.some((u) => u.firstName.toLowerCase() === name.toLowerCase());
  if (exists) return { error: "That name is taken — try signing in instead." };

  const salt = randomSalt();
  const passwordHash = await hashPassword(password, salt);
  const user: StoredUser = {
    id: crypto.randomUUID(),
    firstName: capitalizeName(name),
    passwordHash,
    salt,
  };
  saveUsers([...users, user]);

  const session: AuthSession = { userId: user.id, firstName: user.firstName };
  writeJson(SESSION_KEY, session);
  migrateLegacyData(user.id);
  return { session };
}

export async function loginUser(
  firstName: string,
  password: string,
): Promise<{ session?: AuthSession; error?: string }> {
  const name = normalizeName(firstName);
  const users = getUsers();
  const user = users.find((u) => u.firstName.toLowerCase() === name.toLowerCase());
  if (!user) return { error: "No account found — create one first." };

  const passwordHash = await hashPassword(password, user.salt);
  if (passwordHash !== user.passwordHash) return { error: "Wrong password." };

  const session: AuthSession = { userId: user.id, firstName: user.firstName };
  writeJson(SESSION_KEY, session);
  migrateLegacyData(user.id);
  return { session };
}

export function logoutUser() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

export function formatGreeting(firstName = ""): string {
  const name = firstName.trim();
  if (!name) return "Hey there,";
  return `Hey ${name},`;
}
