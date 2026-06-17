"use client";

import type { ClinicalContradiction, ClinicalMemoryEntry, PatientCase } from "./types";

const DENIAL_PREFIXES = [
  "no ", "denies ", "deny ", "absent", "without", "negative for", "none",
  "no history of", "never", "does not have",
];

const TIMELINE_ACUTE = [
  "sudden", "acute", "minutes", "hours", "abrupt", "immediate",
];

const TIMELINE_CHRONIC = [
  "chronic", "months", "years", "gradual", "insidious", "intermittent",
  "progressive", "long-standing",
];

const SYMPTOM_SYNONYMS: Record<string, string[]> = {
  "shortness of breath": ["dyspnea", "sob", "difficulty breathing", "breathless", "breathlessness", "can't breathe", "hard to breathe", "struggling to breathe", "fighting for air", "short of breath", "out of breath", "cannot catch breath"],
  "chest pain": ["chest discomfort", "chest tightness", "angina", "crushing chest", "substernal pressure", "chest pressure", "retrosternal pain", "stabbing chest", "chest burning"],
  "fever": ["pyrexia", "febrile", "high temperature", "hot", "temperature", "feeling feverish", "rigors"],
  "cough": ["coughing", "hacking", "productive cough", "dry cough", "nonproductive cough", "barking cough"],
  "nausea": ["feeling sick", "queasy", "sick to stomach", "bilious"],
  "vomiting": ["throwing up", "being sick", "emesis", "regurgitation", "puking"],
  "diarrhea": ["loose stools", "watery stools", "frequent stools", "runs", "gastroenteritis"],
  "headache": ["cephalgia", "head pain", "migraine", "splitting headache", "throbbing head"],
  "abdominal pain": ["stomach ache", "belly pain", "abdominal discomfort", "stomach pain", "tummy ache", "abdominal cramps", "gastric pain", "colicky pain"],
  "dizziness": ["vertigo", "lightheadedness", "feeling faint", "presyncope", "woozy", "off balance", "spinning"],
  "fatigue": ["tiredness", "exhaustion", "lethargy", "weakness", "lack of energy", "worn out", "drained"],
  "weight loss": ["unintentional weight loss", "losing weight", "cachexia", "wasting"],
  "palpitations": ["heart racing", "skipping beats", "irregular heartbeat", "pounding heart", "fluttering"],
  "syncope": ["fainting", "passed out", "blacked out", "loss of consciousness", "collapse", "unconscious"],
  "edema": ["swelling", "fluid retention", "puffy", "dependent edema", "pedal edema", "ankle swelling"],
  "rash": ["skin eruption", "hives", "urticaria", "breakout", "spots", "lesion", "erythema"],
  "jaundice": ["yellowing", "icterus", "yellow skin", "yellow eyes"],
  "anxiety": ["nervousness", "panic", "worry", "restlessness", "agitation", "stress"],
  "depression": ["low mood", "sadness", "hopeless", "despair", "down", "melancholy"],
  "insomnia": ["difficulty sleeping", "sleepless", "can't sleep", "poor sleep", "waking up"],
  "back pain": ["spinal pain", "lumbago", "low back pain", "sciatica", "backache"],
  "sore throat": ["pharyngitis", "throat pain", "scratchy throat", "throat irritation", "pain swallowing"],
  "constipation": ["difficulty passing stool", "hard stools", "infrequent bowel", "obstipation"],
  "seizure": ["convulsion", "fit", "epileptic episode", "spasms"],
  "hemoptysis": ["coughing up blood", "blood in sputum", "blood-tinged sputum"],
  "hematemesis": ["vomiting blood", "blood in vomit", "coffee ground emesis"],
  "melena": ["black stools", "blood in stool", "dark tarry stools", "gastrointestinal bleed"],
  "hematuria": ["blood in urine", "bloody urine", "red urine", "pink urine"],
  "dysuria": ["painful urination", "burning urination", "stinging urine"],
  "urinary frequency": ["frequent urination", "urinating often", "polyuria"],
  "urinary urgency": ["urgent urination", "can't hold urine", "sudden urge"],
  "weight gain": ["fluid overload", "increased weight", "bloated"],
  "confusion": ["disorientation", "delirium", "altered mental state", "acute confusion", "not themselves", "agitation"],
  "head injury": ["head trauma", "concussion", "knocked out", "blow to head"],
  "numbness": ["tingling", "paresthesia", "loss of sensation", "pins and needles"],
  "paralysis": ["weakness", "hemiparesis", "hemiplegia", "loss of movement", "cannot move", "monoparesis"],
  "visual disturbance": ["blurred vision", "double vision", "diplopia", "vision loss", "blurry vision"],
  "hearing loss": ["deafness", "difficulty hearing", "reduced hearing"],
  "tinnitus": ["ringing in ears", "buzzing ears", "ear noise"],
};

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function normalizeSymptom(raw: string): string {
  const lower = normalize(raw);
  for (const [canonical, alternatives] of Object.entries(SYMPTOM_SYNONYMS)) {
    if (lower === canonical || alternatives.includes(lower)) return canonical;
    for (const alt of alternatives) {
      if (lower.includes(alt) || alt.includes(lower)) return canonical;
    }
  }
  return lower;
}

function isDenial(text: string): { denied: boolean; symptom: string } {
  const lower = normalize(text);
  for (const prefix of DENIAL_PREFIXES) {
    if (lower.startsWith(prefix)) {
      const symptom = lower.slice(prefix.length).trim();
      if (symptom) return { denied: true, symptom };
    }
  }
  return { denied: false, symptom: lower };
}

function isTimelineTerm(term: string): "acute" | "chronic" | null {
  const lower = normalize(term);
  if (TIMELINE_ACUTE.includes(lower)) return "acute";
  if (TIMELINE_CHRONIC.includes(lower)) return "chronic";
  return null;
}

function extractEntries(
  fieldKey: string,
  value: string | string[] | boolean,
): ClinicalMemoryEntry[] {
  const entries: ClinicalMemoryEntry[] = [];

  if (typeof value === "boolean") {
    entries.push({
      symptom: fieldKey,
      present: value,
      source: fieldKey,
      rawValue: value ? "yes" : "no",
    });
    return entries;
  }

  const values = Array.isArray(value) ? value : [String(value)];
  let allDenied = true;
  let anyDenied = false;

  for (const v of values) {
    const { denied, symptom } = isDenial(v);
    if (denied) {
      anyDenied = true;
      entries.push({
        symptom: normalizeSymptom(symptom || fieldKey),
        present: false,
        source: fieldKey,
        rawValue: v,
      });
    } else if (normalize(v) !== "yes" && normalize(v) !== "no") {
      allDenied = false;
      const syn = normalize(v);
      if (syn !== "skip" && syn !== "not applicable" && syn !== "") {
        entries.push({
          symptom: normalizeSymptom(syn),
          present: true,
          source: fieldKey,
          rawValue: v,
        });
      }
    } else if (normalize(v) === "yes") {
      allDenied = false;
      entries.push({
        symptom: fieldKey,
        present: true,
        source: fieldKey,
        rawValue: v,
      });
    } else if (normalize(v) === "no") {
      anyDenied = true;
      entries.push({
        symptom: fieldKey,
        present: false,
        source: fieldKey,
        rawValue: v,
      });
    }
  }

  return entries;
}

function detectDirectContradictions(
  existing: ClinicalMemoryEntry[],
  incoming: ClinicalMemoryEntry[],
): ClinicalContradiction[] {
  const results: ClinicalContradiction[] = [];

  for (const newEntry of incoming) {
    for (const oldEntry of existing) {
      if (oldEntry.source === newEntry.source) continue;

      const normalizedOld = normalizeSymptom(oldEntry.symptom);
      const normalizedNew = normalizeSymptom(newEntry.symptom);

      const sameSymptom = normalizedOld === normalizedNew;

      if (sameSymptom && oldEntry.present !== newEntry.present) {
        const symptomDisplay = oldEntry.symptom.length > 2 ? oldEntry.symptom : "this symptom";
        results.push({
          type: "direct",
          symptom: newEntry.symptom,
          detail: `"${oldEntry.rawValue}" in ${oldEntry.source} conflicts with "${newEntry.rawValue}" in ${newEntry.source}`,
          clinicalSignificance: `${symptomDisplay} being both present and absent changes the differential — a critical clinical inconsistency that must be resolved before proceeding.`,
          clarificationPrompt: `Can you clarify whether ${symptomDisplay} is present or absent? Please specify the correct timeline or any factors that explain the discrepancy (e.g., medication use, progression, or recall error).`,
          previousEntry: oldEntry,
          newEntry,
          severity: "high",
        });
      }
    }
  }

  return results;
}

function detectTimelineContradictions(
  existing: ClinicalMemoryEntry[],
  incoming: ClinicalMemoryEntry[],
): ClinicalContradiction[] {
  const results: ClinicalContradiction[] = [];
  const allEntries = [...existing, ...incoming];
  if (allEntries.length < 2) return results;

  const acuteSources = new Set<string>();
  const chronicSources = new Set<string>();

  for (const entry of allEntries) {
    const timeline = isTimelineTerm(entry.symptom);
    if (timeline === "acute") acuteSources.add(entry.source);
    if (timeline === "chronic") chronicSources.add(entry.source);
  }

  const sharedSources = [...acuteSources].filter((s) => chronicSources.has(s));
  for (const source of sharedSources) {
    results.push({
      type: "timeline",
      symptom: source,
      detail: `Timeline conflict: the presentation is described as both acute and chronic in the same clinical area ("${source}").`,
      clinicalSignificance: `Acute vs chronic onset fundamentally changes the differential. An acute presentation suggests vascular, infectious, or toxic causes; chronic suggests degenerative, neoplastic, or inflammatory processes.`,
      clarificationPrompt: `Was the onset truly acute (minutes to hours) or has this been present for months? If both, clarify the sequence: has an acute change occurred on a chronic background?`,
      previousEntry: { symptom: "acute", present: true, source, rawValue: "acute" },
      newEntry: { symptom: "chronic", present: true, source, rawValue: "chronic" },
      severity: "medium",
    });
  }

  return results;
}

export function detectContradictions(
  patientCase: PatientCase,
  fieldKey: string,
  value: string | string[] | boolean,
): ClinicalContradiction[] {
  const existing = buildMemory(patientCase, fieldKey);
  const incoming = extractEntries(fieldKey, value);

  const direct = detectDirectContradictions(existing, incoming);
  const timeline = detectTimelineContradictions(existing, incoming);

  return [...direct, ...timeline];
}

export async function aiDetectContradictions(
  patientCase: PatientCase,
): Promise<ClinicalContradiction[]> {
  if (typeof window === "undefined") return [];

  try {
    const res = await fetch("/api/clinical/check-consistency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientCase }),
    });

    if (!res.ok) return [];

    const data = await res.json() as {
      contradictions?: Array<{
        type: "direct" | "timeline" | "severity" | "logical";
        detail: string;
        clinicalSignificance: string;
        clarificationPrompt: string;
      }>;
    };

    if (!data.contradictions?.length) return [];

    return data.contradictions.map((c) => ({
      type: c.type,
      symptom: c.detail.split(" ").slice(0, 3).join(" "),
      detail: c.detail,
      clinicalSignificance: c.clinicalSignificance,
      clarificationPrompt: c.clarificationPrompt,
      previousEntry: { symptom: "", present: false, source: "ai", rawValue: "" },
      newEntry: { symptom: "", present: false, source: "ai", rawValue: "" },
      severity: c.type === "direct" ? "high" : "medium",
    }));
  } catch {
    return [];
  }
}

function buildMemory(patientCase: PatientCase, skipField?: string): ClinicalMemoryEntry[] {
  const entries: ClinicalMemoryEntry[] = [];

  for (const [key, value] of Object.entries(patientCase.history)) {
    if (key === skipField) continue;
    if (key === "complete") continue;
    entries.push(...extractEntries(key, value));
  }

  for (const [key, value] of Object.entries(patientCase.exam)) {
    if (key === skipField) continue;
    entries.push(...extractEntries(key, value));
  }

  for (const complaint of patientCase.chiefComplaints) {
    entries.push({
      symptom: normalizeSymptom(complaint),
      present: true,
      source: "chief_complaint",
      rawValue: complaint,
    });
  }

  return entries;
}


