import type { CaseMode, GeneratedTeachingCase, SavedCase } from "./types";

const LIBRARY_KEY = "dxflow-library";
const SEEN_DISEASES_KEY = "dxflow-seen-diseases";
const SEEN_TITLES_KEY = "dxflow-seen-titles";
const SEEN_VIGNETTES_KEY = "dxflow-seen-vignettes";

let currentUserId: string | null = null;

export function setLibraryUserId(userId: string | null) {
  currentUserId = userId;
}

function scopedKey(base: string): string {
  return currentUserId ? `${base}-${currentUserId}` : base;
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

export function getLibrary(): SavedCase[] {
  return readJson<SavedCase[]>(scopedKey(LIBRARY_KEY), []);
}

export function saveToLibrary(entry: SavedCase) {
  const key = scopedKey(LIBRARY_KEY);
  const lib = getLibrary().filter((c) => c.id !== entry.id);
  writeJson(key, [entry, ...lib].slice(0, 200));
}

export function removeFromLibrary(id: string) {
  writeJson(
    scopedKey(LIBRARY_KEY),
    getLibrary().filter((c) => c.id !== id),
  );
}

export function clearLibrary() {
  writeJson(scopedKey(LIBRARY_KEY), []);
}

export function getLibraryItem(id: string) {
  return getLibrary().find((c) => c.id === id);
}

export function searchLibrary(query: string, mode?: CaseMode) {
  const q = query.toLowerCase().trim();
  return getLibrary().filter((c) => {
    if (mode && c.mode !== mode) return false;
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.subject?.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)) ||
      c.patientCase?.chiefComplaints.some((cc) => cc.toLowerCase().includes(q))
    );
  });
}

export function getSeenDiseases(subject: string): string[] {
  const all = readJson<Record<string, string[]>>(scopedKey(SEEN_DISEASES_KEY), {});
  return all[subject] ?? [];
}

export function markDiseaseSeen(subject: string, disease: string) {
  const key = scopedKey(SEEN_DISEASES_KEY);
  const all = readJson<Record<string, string[]>>(key, {});
  const seen = all[subject] ?? [];
  const normalized = disease.toLowerCase().trim();
  if (!seen.some((d) => d.toLowerCase() === normalized)) {
    all[subject] = [...seen, disease].slice(-80);
    writeJson(key, all);
  }
}

export function getSeenTitles(subject: string): string[] {
  const all = readJson<Record<string, string[]>>(scopedKey(SEEN_TITLES_KEY), {});
  return all[subject] ?? [];
}

export function markTitleSeen(subject: string, title: string) {
  const key = scopedKey(SEEN_TITLES_KEY);
  const all = readJson<Record<string, string[]>>(key, {});
  const seen = all[subject] ?? [];
  if (!seen.includes(title)) {
    all[subject] = [...seen, title].slice(-50);
    writeJson(key, all);
  }
}

export function getSeenVignettes(subject: string): string[] {
  const all = readJson<Record<string, string[]>>(scopedKey(SEEN_VIGNETTES_KEY), {});
  return all[subject] ?? [];
}

export function markVignettesSeen(subject: string, vignettes: string[]) {
  const key = scopedKey(SEEN_VIGNETTES_KEY);
  const all = readJson<Record<string, string[]>>(key, {});
  const seen = all[subject] ?? [];
  const next = [...seen];
  for (const v of vignettes) {
    const fingerprint = v.slice(0, 120).toLowerCase().trim();
    if (fingerprint && !next.some((s) => s === fingerprint)) {
      next.push(fingerprint);
    }
  }
  all[subject] = next.slice(-60);
  writeJson(key, all);
}

export function isInLibrary(id: string) {
  return getLibrary().some((c) => c.id === id);
}

export function saveTeachingToLibrary(caseData: GeneratedTeachingCase) {
  const entry: SavedCase = {
    id: caseData.id,
    mode: "teaching",
    title: caseData.title,
    subject: caseData.subjectName,
    tags: [caseData.subject, caseData.difficulty],
    savedAt: Date.now(),
    teachingCase: caseData,
  };
  saveToLibrary(entry);
}
