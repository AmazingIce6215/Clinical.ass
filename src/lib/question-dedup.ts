import type { PatientCase } from "./types";

function hasValue(v: string | string[] | boolean | undefined): boolean {
  if (v === undefined) return false;
  if (typeof v === "boolean") return true;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim().length > 0;
}

export function getAnsweredFieldKeys(patientCase: PatientCase): string[] {
  const keys: string[] = [];

  for (const [k, v] of Object.entries(patientCase.history)) {
    if (hasValue(v)) keys.push(k);
  }
  for (const [k, v] of Object.entries(patientCase.exam)) {
    if (hasValue(v)) keys.push(k);
  }
  if (patientCase.investigations.length > 0) keys.push("investigations");

  return keys;
}

export function isTopicAlreadyAnswered(fieldKey: string, answeredKeys: string[]): boolean {
  return answeredKeys.includes(fieldKey);
}

export function getCollectedSummary(patientCase: PatientCase): string {
  const lines: string[] = [];

  if (patientCase.name) {
    lines.push(`Patient: ${patientCase.name}, ${patientCase.sex}, ${patientCase.age}y`);
  }
  if (patientCase.chiefComplaints.length) {
    lines.push(`Chief complaints: ${patientCase.chiefComplaints.join(", ")}`);
  }
  for (const [k, v] of Object.entries(patientCase.history)) {
    if (!hasValue(v)) continue;
    const val = Array.isArray(v) ? v.join(", ") : String(v);
    lines.push(`${k}: ${val}`);
  }
  for (const [k, v] of Object.entries(patientCase.exam)) {
    if (!hasValue(v)) continue;
    const val = Array.isArray(v) ? v.join(", ") : String(v);
    lines.push(`Exam ${k}: ${val}`);
  }
  if (patientCase.investigations.length) {
    lines.push(`Investigations ordered: ${patientCase.investigations.join(", ")}`);
  }

  return lines.join("\n");
}
