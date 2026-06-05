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

const USERS_KEY = "dxflow-users";
const SESSION_KEY = "dxflow-session";

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
  return readJson<StoredUser[]>(USERS_KEY, []);
}

function saveUsers(users: StoredUser[]) {
  writeJson(USERS_KEY, users);
}

function migrateLegacyData(userId: string) {
  const legacyKeys = [
    "dxflow-library",
    "dxflow-seen-diseases",
    "dxflow-seen-titles",
    "dxflow-seen-vignettes",
    "dxflow-favorites",
    "dxflow-seen-cases",
  ];
  for (const key of legacyKeys) {
    const legacy = localStorage.getItem(key);
    const scoped = localStorage.getItem(`${key}-${userId}`);
    if (legacy && !scoped) {
      localStorage.setItem(`${key}-${userId}`, legacy);
      localStorage.removeItem(key);
    }
  }
}

export function getSession(): AuthSession | null {
  return readJson<AuthSession | null>(SESSION_KEY, null);
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

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatGreeting(firstName: string, date = new Date()): string {
  return `${getTimeGreeting(date)}, ${firstName}!`;
}
