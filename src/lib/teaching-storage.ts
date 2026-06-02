import type { GeneratedTeachingCase } from "./types";

const SEEN_KEY = "dxflow-seen-cases";
const FAV_KEY = "dxflow-favorites";

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

export function getSeenTitles(subject: string): string[] {
  const all = readJson<Record<string, string[]>>(SEEN_KEY, {});
  return all[subject] ?? [];
}

export function markCaseSeen(subject: string, title: string) {
  const all = readJson<Record<string, string[]>>(SEEN_KEY, {});
  const seen = all[subject] ?? [];
  if (!seen.includes(title)) {
    all[subject] = [...seen, title].slice(-50);
    writeJson(SEEN_KEY, all);
  }
}

export function getFavorites(): GeneratedTeachingCase[] {
  return readJson<GeneratedTeachingCase[]>(FAV_KEY, []);
}

export function saveFavorite(caseData: GeneratedTeachingCase) {
  const favs = getFavorites();
  if (favs.some((f) => f.id === caseData.id)) return;
  writeJson(FAV_KEY, [{ ...caseData, favorited: true }, ...favs].slice(0, 100));
}

export function removeFavorite(id: string) {
  writeJson(
    FAV_KEY,
    getFavorites().filter((f) => f.id !== id),
  );
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id);
}

export function getFavorite(id: string): GeneratedTeachingCase | undefined {
  return getFavorites().find((f) => f.id === id);
}
