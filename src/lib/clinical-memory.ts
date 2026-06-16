"use client";

import type { ClinicalContradiction, ClinicalMemoryEntry, PatientCase } from "./types";

const DENIAL_PREFIXES = [
  "no ", "denies ", "deny ", "absent", "without", "negative for", "none",
  "no history of", "never", "does not have",
];

const SEVERITY_LEVELS = [
  ["mild", "minimal", "slight", "minor"],
  ["moderate", "intermediate"],
  ["severe", "severe / debilitating", "intense", "extreme", "excruciating"],
];

const TIMELINE_ACUTE = [
  "sudden", "acute", "minutes", "hours", "abrupt", "immediate",
];

const TIMELINE_CHRONIC = [
  "chronic", "months", "years", "gradual", "insidious", "intermittent",
  "progressive", "long-standing",
];

function normalize(s: string): string {
  return s.toLowerCase().trim();
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

function isSeverityTerm(term: string): number | null {
  const lower = normalize(term);
  for (let level = 0; level < SEVERITY_LEVELS.length; level++) {
    if (SEVERITY_LEVELS[level].includes(lower)) return level;
  }
  return null;
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
        symptom: symptom || fieldKey,
        present: false,
        source: fieldKey,
        rawValue: v,
      });
    } else if (normalize(v) !== "yes" && normalize(v) !== "no") {
      allDenied = false;
      const syn = normalize(v);
      if (syn !== "skip" && syn !== "not applicable" && syn !== "") {
        entries.push({
          symptom: syn,
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

  if (allDenied && !anyDenied) {
    entries.push({
      symptom: fieldKey,
      present: false,
      source: fieldKey,
      rawValue: "denied",
    });
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

      const sameSymptom =
        oldEntry.symptom === newEntry.symptom ||
        newEntry.symptom.includes(oldEntry.symptom) ||
        oldEntry.symptom.includes(newEntry.symptom);

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

function detectSeverityContradictions(
  existing: ClinicalMemoryEntry[],
  incoming: ClinicalMemoryEntry[],
): ClinicalContradiction[] {
  const results: ClinicalContradiction[] = [];
  const allEntries = [...existing, ...incoming];

  const symptomLevels: Map<string, { level: number; source: string; rawValue: string }[]> = new Map();

  for (const entry of allEntries) {
    const level = isSeverityTerm(entry.symptom);
    if (level !== null) {
      const cluster = findSymptomCluster(entry.source, allEntries);
      for (const symptom of cluster) {
        const existing = symptomLevels.get(symptom) ?? [];
        existing.push({ level, source: entry.source, rawValue: entry.rawValue });
        symptomLevels.set(symptom, existing);
      }
    }
  }

  for (const [, entries] of symptomLevels) {
    if (entries.length < 2) continue;
    const levels = entries.map((e) => e.level);
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    if (max - min >= 2) {
      const high = entries.find((e) => e.level === max)!;
      const low = entries.find((e) => e.level === min)!;
      results.push({
        type: "severity",
        symptom: high.source === low.source ? high.rawValue : `${high.rawValue} vs ${low.rawValue}`,
        detail: `Severity mismatch: "${high.rawValue}" in ${high.source} vs "${low.rawValue}" in ${low.source} for the same clinical concern.`,
        clinicalSignificance: `Severity guides urgency and investigation intensity. Mild and severe presentations of the same condition require different diagnostic approaches and management pathways.`,
        clarificationPrompt: `Can you clarify the true severity? Is there a specific reason the severity varies (e.g., symptoms that come and go, or different times of day)?`,
        previousEntry: {
          symptom: severityLabel(min),
          present: true,
          source: low.source,
          rawValue: low.rawValue,
        },
        newEntry: {
          symptom: severityLabel(max),
          present: true,
          source: high.source,
          rawValue: high.rawValue,
        },
        severity: "medium",
      });
    }
  }

  return results;
}

function findSymptomCluster(source: string, entries: ClinicalMemoryEntry[]): string[] {
  const sourceEntries = entries.filter((e) => e.source === source);
  return [...new Set(sourceEntries.map((e) => e.symptom).filter((s) => s.length > 2))];
}

function severityLabel(level: number): string {
  return ["mild", "moderate", "severe"][level] ?? "unknown";
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
  const severity = detectSeverityContradictions(existing, incoming);

  return [...direct, ...timeline, ...severity];
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
      symptom: normalize(complaint),
      present: true,
      source: "chief_complaint",
      rawValue: complaint,
    });
  }

  return entries;
}


