"use client";

import type {
  ActivityDay,
  OsceDifficultyStats,
  OsceDomainStat,
  OsceSessionRecord,
  OsceStats,
  OsceTrendPoint,
  OsceWeakness,
  StreakData,
} from "./types";

const OSCE_STATS_KEY = "clincalass-osce-stats";

let currentUserId: string | null = null;

export function setOsceStatsUserId(userId: string | null) {
  currentUserId = userId;
}

function scopedKey(): string {
  return currentUserId ? `${OSCE_STATS_KEY}-${currentUserId}` : OSCE_STATS_KEY;
}

function readStats(): OsceStats {
  if (typeof window === "undefined") {
    return emptyStats();
  }
  try {
    const raw = localStorage.getItem(scopedKey());
    if (raw) {
      return JSON.parse(raw) as OsceStats;
    }
  } catch {
    // ignore
  }
  return emptyStats();
}

function writeStats(stats: OsceStats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(scopedKey(), JSON.stringify(stats));
}

function emptyStats(): OsceStats {
  return {
    sessions: [],
    streak: { current: 0, longest: 0, lastActiveDate: "" },
    weeklyLog: [],
  };
}

function getDateString(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().slice(0, 10);
}

function updateStreak(streak: StreakData): StreakData {
  const today = getDateString();
  const yesterday = getDateString(new Date(Date.now() - 86400000));

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

function updateWeeklyLog(log: ActivityDay[]): ActivityDay[] {
  const today = getDateString();
  const existing = log.find((d) => d.date === today);
  if (existing) {
    return log.map((d) =>
      d.date === today ? { ...d, questionsAnswered: d.questionsAnswered + 1 } : d,
    );
  }
  return [...log, { date: today, questionsAnswered: 1 }];
}

export function getOsceStats(): OsceStats {
  return readStats();
}

export function logOsceSession(session: OsceSessionRecord): OsceStats {
  const stats = readStats();

  stats.sessions = [session, ...stats.sessions].slice(0, 100);
  stats.streak = updateStreak(stats.streak);
  stats.weeklyLog = updateWeeklyLog(stats.weeklyLog);

  writeStats(stats);
  return stats;
}

export function getOsceOverallStats() {
  const stats = readStats();
  const sessions = stats.sessions;

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averageScore: 0,
      passRate: 0,
      bestScore: 0,
    };
  }

  const totalSessions = sessions.length;
  const totalScore = sessions.reduce((s, r) => s + r.score, 0);
  const passed = sessions.filter((r) => r.passed).length;
  const bestScore = Math.max(...sessions.map((r) => r.score));

  return {
    totalSessions,
    averageScore: Math.round(totalScore / totalSessions),
    passRate: Math.round((passed / totalSessions) * 100),
    bestScore,
  };
}

export function getOsceDomainBreakdown(): OsceDomainStat[] {
  const stats = readStats();
  const sessions = stats.sessions;

  const domains: { key: OsceDomainStat["key"]; label: string; max: number }[] = [
    { key: "history", label: "History Taking", max: 40 },
    { key: "differential", label: "Differential Diagnosis", max: 20 },
    { key: "investigations", label: "Investigations", max: 20 },
    { key: "management", label: "Management", max: 20 },
  ];

  if (sessions.length === 0) {
    return domains.map((d) => ({ ...d, average: 0 }));
  }

  return domains.map((d) => {
    const total = sessions.reduce((s, r) => s + r.breakdown[d.key], 0);
    return {
      key: d.key,
      label: d.label,
      average: Math.round((total / sessions.length) * 10) / 10,
      max: d.max,
    };
  });
}

export function getOsceTrendData(): OsceTrendPoint[] {
  const stats = readStats();
  return stats.sessions
    .slice(0, 20)
    .reverse()
    .map((s, i) => ({
      sessionIndex: i + 1,
      score: s.score,
      timestamp: s.timestamp,
      difficulty: s.difficulty,
    }));
}

export function getOsceWeaknesses(): OsceWeakness[] {
  const stats = readStats();
  const sessions = stats.sessions;

  if (sessions.length < 2) return [];

  const weaknesses: OsceWeakness[] = [];

  // Domain weakness detection
  const domainScores: Record<string, number[]> = {
    history: [],
    differential: [],
    investigations: [],
    management: [],
  };

  for (const s of sessions) {
    domainScores.history.push(s.breakdown.history);
    domainScores.differential.push(s.breakdown.differential);
    domainScores.investigations.push(s.breakdown.investigations);
    domainScores.management.push(s.breakdown.management);
  }

  const domainLabels: Record<string, string> = {
    history: "History Taking",
    differential: "Differential Diagnosis",
    investigations: "Investigations",
    management: "Management",
  };

  for (const [key, scores] of Object.entries(domainScores)) {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    const max = key === "history" ? 40 : 20;
    const pct = (avg / max) * 100;

    if (pct < 50) {
      weaknesses.push({
        type: "domain",
        label: domainLabels[key],
        severity: "high",
        frequency: sessions.length,
        description: `Average ${domainLabels[key].toLowerCase()} score is ${Math.round(pct)}% — below passing threshold`,
      });
    } else if (pct < 65) {
      weaknesses.push({
        type: "domain",
        label: domainLabels[key],
        severity: "medium",
        frequency: sessions.length,
        description: `${domainLabels[key]} needs improvement (${Math.round(pct)}% average)`,
      });
    }
  }

  // Communication pattern detection
  const avgMissedRedFlags =
    sessions.reduce((s, r) => s + r.missedRedFlags, 0) / sessions.length;
  if (avgMissedRedFlags > 1.5) {
    weaknesses.push({
      type: "pattern",
      label: "Missed Red Flags",
      severity: "high",
      frequency: Math.round(avgMissedRedFlags),
      description: `Averaging ${avgMissedRedFlags.toFixed(1)} missed red flags per station — review safety-netting`,
    });
  }

  const avgMissedQuestions =
    sessions.reduce((s, r) => s + r.missedKeyQuestions, 0) / sessions.length;
  if (avgMissedQuestions > 2) {
    weaknesses.push({
      type: "pattern",
      label: "Missed Key Questions",
      severity: "high",
      frequency: Math.round(avgMissedQuestions),
      description: `Missing ${avgMissedQuestions.toFixed(1)} key questions per station — systematic history approach needed`,
    });
  }

  const avgAnchoring =
    sessions.reduce((s, r) => s + r.anchoringErrors, 0) / sessions.length;
  if (avgAnchoring > 0.5) {
    weaknesses.push({
      type: "pattern",
      label: "Anchoring Bias",
      severity: avgAnchoring > 1 ? "high" : "medium",
      frequency: Math.round(avgAnchoring),
      description: `Anchoring detected in ${avgAnchoring.toFixed(1)} sessions per station — consider broader differentials`,
    });
  }

  return weaknesses.sort((a, b) => {
    const severityRank = { high: 3, medium: 2, low: 1 };
    return severityRank[b.severity] - severityRank[a.severity];
  });
}

export function getOsceDifficultyStats(): OsceDifficultyStats {
  const stats = readStats();
  const sessions = stats.sessions;

  const byDifficulty: Record<string, number[]> = {
    easy: [],
    medium: [],
    hard: [],
  };

  for (const s of sessions) {
    byDifficulty[s.difficulty]?.push(s.score);
  }

  function compute(difficulty: "easy" | "medium" | "hard") {
    const scores = byDifficulty[difficulty] ?? [];
    return {
      sessions: scores.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  }

  return {
    easy: compute("easy"),
    medium: compute("medium"),
    hard: compute("hard"),
  };
}

export function getOsceRecentSessions(limit = 10): OsceSessionRecord[] {
  return readStats().sessions.slice(0, limit);
}

export function getOsceStreak() {
  return readStats().streak;
}

export function getOsceConsistencyScore(): number {
  const stats = readStats();
  const sessions = stats.sessions;
  if (sessions.length < 3) return 100;

  const scores = sessions.map((s) => s.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const maxDev = 50;
  const consistency = Math.max(0, 100 - (stdDev / maxDev) * 100);

  return Math.round(consistency);
}

export function getOsceImprovementRate(): number {
  const stats = readStats();
  const sessions = stats.sessions;
  if (sessions.length < 4) return 0;

  const recent = sessions.slice(0, Math.min(10, sessions.length)).reverse();
  const midpoint = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, midpoint);
  const secondHalf = recent.slice(midpoint);

  const firstAvg = firstHalf.reduce((s, r) => s + r.score, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((s, r) => s + r.score, 0) / secondHalf.length;

  if (firstAvg === 0) return 0;
  return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
}

export function getOsceActivityData(): { date: string; sessions: number }[] {
  const stats = readStats();
  const today = new Date();
  const data: { date: string; sessions: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getDateString(d);
    const count = stats.weeklyLog.find((w) => w.date === dateStr)?.questionsAnswered ?? 0;
    data.push({ date: dateStr, sessions: count });
  }

  return data;
}
