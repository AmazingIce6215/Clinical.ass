const FINGERPRINT_KEY = "clincalass-case-fingerprints";

function getStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FINGERPRINT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function store(hashes: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FINGERPRINT_KEY, JSON.stringify(hashes));
}

export function getCaseFingerprints(): string[] {
  return getStored();
}

export function addCaseFingerprints(newHashes: string[]) {
  const existing = getStored();
  const updated = [...new Set([...newHashes, ...existing])].slice(0, 200);
  store(updated);
}

export function clearCaseFingerprints() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FINGERPRINT_KEY);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ngramTokens(text: string, n: number): Set<string> {
  const tokens = normalize(text).split(/\s+/);
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export function computeFingerprint(
  title: string,
  vignette: string,
  diagnosisText: string,
): string {
  const raw = `${normalize(title)}::${normalize(vignette)}::${normalize(diagnosisText)}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function isDuplicate(fingerprint: string): boolean {
  return getStored().includes(fingerprint);
}

export function checkSimilarity(
  title: string,
  vignette: string,
  diagnosisText: string,
): { duplicate: boolean; maxSimilarity: number } {
  const stored = getStored();
  if (stored.length === 0) return { duplicate: false, maxSimilarity: 0 };

  const fp = computeFingerprint(title, vignette, diagnosisText);
  if (stored.includes(fp)) {
    return { duplicate: true, maxSimilarity: 1 };
  }

  const currBigrams = ngramTokens(title + " " + vignette + " " + diagnosisText, 3);
  let maxSim = 0;

  for (const storedHash of stored) {
    const storedBigrams = ngramTokens(storedHash, 3);
    const sim = jaccardSimilarity(currBigrams, storedBigrams);
    if (sim > maxSim) maxSim = sim;
  }

  return { duplicate: maxSim > 0.65, maxSimilarity: Math.round(maxSim * 100) / 100 };
}
