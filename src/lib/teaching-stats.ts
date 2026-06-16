"use client";

import type {
  QuestionAttempt,
  SubjectStat,
  UserStats,
  WeakTopic,
} from "./types";
import { teachingSubjects } from "./teaching-subjects";

const STATS_KEY = "clincalass-teaching-stats";

let currentUserId: string | null = null;

export function setStatsUserId(userId: string | null) {
  currentUserId = userId;
}

function scopedKey(): string {
  return currentUserId ? `${STATS_KEY}-${currentUserId}` : STATS_KEY;
}

function readStats(): UserStats {
  if (typeof window === "undefined") {
    return emptyStats();
  }
  try {
    const raw = localStorage.getItem(scopedKey());
    if (raw) {
      const parsed = JSON.parse(raw) as UserStats;
      return parsed;
    }
  } catch {
    // ignore
  }
  return emptyStats();
}

function writeStats(stats: UserStats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(scopedKey(), JSON.stringify(stats));
}

function emptyStats(): UserStats {
  return {
    subjectStats: {},
    weakTopics: {},
    streak: { current: 0, longest: 0, lastActiveDate: "" },
    activityLog: [],
    recentAttempts: [],
  };
}

export function getUserStats(): UserStats {
  return readStats();
}

function getDateString(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().slice(0, 10);
}

function updateStreak(streak: UserStats["streak"]): UserStats["streak"] {
  const today = getDateString();
  const yesterday = getDateString(
    new Date(Date.now() - 86400000),
  );

  if (streak.lastActiveDate === today) {
    return streak;
  }

  if (streak.lastActiveDate === yesterday) {
    const current = streak.current + 1;
    return {
      current,
      longest: Math.max(current, streak.longest),
      lastActiveDate: today,
    };
  }

  return {
    current: 1,
    longest: streak.longest,
    lastActiveDate: today,
  };
}

function updateActivityLog(
  activityLog: UserStats["activityLog"],
): UserStats["activityLog"] {
  const today = getDateString();
  const existing = activityLog.find((d) => d.date === today);
  if (existing) {
    return activityLog.map((d) =>
      d.date === today
        ? { ...d, questionsAnswered: d.questionsAnswered + 1 }
        : d,
    );
  }
  return [...activityLog, { date: today, questionsAnswered: 1 }];
}

function updateSubjectStats(
  subject: string,
  correct: boolean,
  difficulty: string,
  timeTaken: number,
  subjectStats: Record<string, SubjectStat>,
): Record<string, SubjectStat> {
  const existing = subjectStats[subject] ?? {
    attempted: 0,
    correct: 0,
    accuracy: 0,
    history: [],
  };

  const updated: SubjectStat = {
    attempted: existing.attempted + 1,
    correct: existing.correct + (correct ? 1 : 0),
    accuracy: 0,
    history: [
      ...existing.history,
      { timestamp: Date.now(), correct, difficulty, timeTaken },
    ],
  };
  updated.accuracy =
    updated.attempted > 0
      ? Math.round((updated.correct / updated.attempted) * 100)
      : 0;

  return { ...subjectStats, [subject]: updated };
}

function extractTopicFromQuestion(
  vignette: string,
  options: string[],
  subject: string,
): string {
  const lowerVignette = vignette.toLowerCase();
  const lowerOptions = options.map((o) => o.toLowerCase());

  const topicMap: Record<string, string[]> = {
    "acs": ["acs", "stem", "nstemi", "myocardial infarction", "chest pain", "coronary"],
    "heart failure": ["heart failure", "congestive", "pulmonary edema", "sob"],
    "arrhythmia": ["arrhythmia", "afib", "atrial fibrillation", "ventricular tachycardia", "palpitations"],
    "pneumonia": ["pneumonia", "consolidation", "cough", "sputum"],
    "asthma": ["asthma", "wheezing", "bronchospasm"],
    "uti": ["uti", "urinary tract", "dysuria", "pyelonephritis"],
    "neonatal": ["neonatal", "newborn", "neonate", "perinatal"],
    "trauma": ["trauma", "injury", "fracture", "head injury", "blunt"],
    "stroke": ["stroke", "cva", "hemiparesis", "facial droop"],
    "sepsis": ["sepsis", "septic", "bacteremia", "shock"],
    "meningitis": ["meningitis", "meningeal", "neck stiffness"],
    "diabetes": ["diabetes", "dka", "hyperglycemia", "hypoglycemia"],
    "preeclampsia": ["preeclampsia", "eclampsia", "hypertension pregnancy"],
    "appendicitis": ["appendicitis", "right iliac fossa", "rlq pain"],
    "depression": ["depression", "mood", "antidepressant", "ssri"],
    "ecg": ["ecg", "electrocardiogram", "ekg", "st elevation"],
  };

  for (const [topic, keywords] of Object.entries(topicMap)) {
    const matches = keywords.some(
      (k) =>
        lowerVignette.includes(k) ||
        lowerOptions.some((o) => o.includes(k)),
    );
    if (matches) return topic;
  }

  const fallbackMap: Record<string, string> = {
    "cardiology": "cardiac",
    "neurology": "neurological",
    "pediatrics": "pediatric",
    "surgery": "surgical",
    "infectious-disease": "infectious",
    "internal-medicine": "internal medicine",
    "emergency-medicine": "emergency",
    "obgyn": "ob-gyn",
    "psychiatry": "psychiatric",
    "dermatology": "dermatologic",
  };

  return fallbackMap[subject] ?? "general";
}

function updateWeakTopics(
  correct: boolean,
  topic: string,
  weakTopics: Record<string, WeakTopic>,
): Record<string, WeakTopic> {
  if (correct) return weakTopics;

  const existing = weakTopics[topic] ?? {
    topic,
    incorrectCount: 0,
    lastSeen: 0,
    totalAttempts: 0,
    accuracy: 100,
  };

  const updated: WeakTopic = {
    topic,
    incorrectCount: existing.incorrectCount + 1,
    lastSeen: Date.now(),
    totalAttempts: existing.totalAttempts + 1,
    accuracy: 0,
  };
  updated.accuracy = Math.round(
    ((updated.totalAttempts - updated.incorrectCount) /
      updated.totalAttempts) *
      100,
  );

  return { ...weakTopics, [topic]: updated };
}

function updateWeakTopicsOnCorrect(
  topic: string,
  weakTopics: Record<string, WeakTopic>,
): Record<string, WeakTopic> {
  const existing = weakTopics[topic];
  if (!existing) return weakTopics;

  const updated: WeakTopic = {
    ...existing,
    totalAttempts: existing.totalAttempts + 1,
    accuracy: Math.round(
      ((existing.totalAttempts + 1 - existing.incorrectCount) /
        (existing.totalAttempts + 1)) *
        100,
    ),
    lastSeen: Date.now(),
  };

  return { ...weakTopics, [topic]: updated };
}

export function logAttempt(attempt: Omit<QuestionAttempt, "timestamp">): UserStats {
  const stats = readStats();

  const subjectStats = updateSubjectStats(
    attempt.subject,
    attempt.correct,
    attempt.difficulty,
    attempt.timeTaken,
    stats.subjectStats,
  );

  const topic = attempt.topic ?? extractTopicFromQuestion("", [], attempt.subject);

  const weakTopics = attempt.correct
    ? updateWeakTopicsOnCorrect(topic, stats.weakTopics)
    : updateWeakTopics(attempt.correct, topic, stats.weakTopics);

  const streak = updateStreak(stats.streak);
  const activityLog = updateActivityLog(stats.activityLog);

  const fullAttempt: QuestionAttempt = {
    ...attempt,
    topic,
    timestamp: Date.now(),
  };

  const recentAttempts = [fullAttempt, ...stats.recentAttempts].slice(0, 50);

  const updated: UserStats = {
    subjectStats,
    weakTopics,
    streak,
    activityLog,
    recentAttempts,
  };

  writeStats(updated);
  return updated;
}

export function getSubjectStats(subject: string): SubjectStat | null {
  const stats = readStats();
  return stats.subjectStats[subject] ?? null;
}

export function getWeakTopics(): WeakTopic[] {
  const stats = readStats();
  return Object.values(stats.weakTopics)
    .filter((t) => t.incorrectCount > 0)
    .sort((a, b) => b.incorrectCount - a.incorrectCount)
    .slice(0, 20);
}

export function getStreak() {
  return readStats().streak;
}

export function getActivityLog() {
  return readStats().activityLog;
}

export function getRecentAttempts(limit = 10): QuestionAttempt[] {
  return readStats().recentAttempts.slice(0, limit);
}

export function getOverallStats() {
  const stats = readStats();
  const subjects = Object.entries(stats.subjectStats);
  const totalAttempted = subjects.reduce((s, [, v]) => s + v.attempted, 0);
  const totalCorrect = subjects.reduce((s, [, v]) => s + v.correct, 0);
  const overallAccuracy =
    totalAttempted > 0
      ? Math.round((totalCorrect / totalAttempted) * 100)
      : 0;

  let weakest = "";
  let strongest = "";
  let weakestAccuracy = 100;
  let strongestAccuracy = 0;

  for (const [id, stat] of subjects) {
    if (stat.attempted >= 1) {
      if (stat.accuracy <= weakestAccuracy) {
        weakestAccuracy = stat.accuracy;
        weakest = id;
      }
      if (stat.accuracy >= strongestAccuracy) {
        strongestAccuracy = stat.accuracy;
        strongest = id;
      }
    }
  }

  const totalTime = subjects.reduce(
    (s, [, v]) =>
      s + v.history.reduce((ts, h) => ts + (h.timeTaken ?? 0), 0),
    0,
  );

  return {
    totalAttempted,
    totalCorrect,
    overallAccuracy,
    weakest,
    strongest,
    totalStudyTime: totalTime,
  };
}

export function getSubjectBreakdown() {
  const stats = readStats();
  return teachingSubjects
    .map((s: { id: string; name: string; icon: string }) => {
      const stat = stats.subjectStats[s.id];
      return {
        id: s.id,
        name: s.name,
        icon: s.icon,
        attempted: stat?.attempted ?? 0,
        correct: stat?.correct ?? 0,
        accuracy: stat?.accuracy ?? 0,
      };
    })
    .filter((s: { attempted: number }) => s.attempted > 0)
    .sort(
      (a: { accuracy: number }, b: { accuracy: number }) =>
        a.accuracy - b.accuracy,
    );
}

export function getActivityHeatmapData(): Array<{
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}> {
  const stats = readStats();
  const today = new Date();
  const result: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> = [];

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getDateString(d);
    const day = stats.activityLog.find((a) => a.date === dateStr);
    const count = day?.questionsAnswered ?? 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      if (count <= 3) level = 1;
      else if (count <= 7) level = 2;
      else if (count <= 15) level = 3;
      else level = 4;
    }
    result.push({ date: dateStr, count, level });
  }

  return result;
}
