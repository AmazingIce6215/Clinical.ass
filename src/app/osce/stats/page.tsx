"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AppShell, GlassCard } from "@/components/app-shell";
import { FadeSlide } from "@/components/motion";
import {
  getOsceConsistencyScore,
  getOsceDifficultyStats,
  getOsceDomainBreakdown,
  getOsceImprovementRate,
  getOsceOverallStats,
  getOsceRecentSessions,
  getOsceStreak,
  getOsceTrendData,
  getOsceWeaknesses,
} from "@/lib/osce-stats";
import { cn } from "@/lib/utils";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function OsceStatsPage() {
  const overall = useMemo(() => getOsceOverallStats(), []);
  const domains = useMemo(() => getOsceDomainBreakdown(), []);
  const trend = useMemo(() => getOsceTrendData(), []);
  const weaknesses = useMemo(() => getOsceWeaknesses(), []);
  const difficultyStats = useMemo(() => getOsceDifficultyStats(), []);
  const consistency = useMemo(() => getOsceConsistencyScore(), []);
  const improvement = useMemo(() => getOsceImprovementRate(), []);
  const recent = useMemo(() => getOsceRecentSessions(10), []);
  const streak = useMemo(() => getOsceStreak(), []);

  const noData = overall.totalSessions === 0;

  if (noData) {
    return (
      <AppShell backHref="/osce" title="OSCE Stats" subtitle="Track your clinical exam performance">
        <div className="flex flex-1 items-center justify-center py-24">
          <GlassCard className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <span className="text-3xl">📊</span>
            </div>
            <h2 className="mb-2 text-xl font-bold">No OSCE Data Yet</h2>
            <p className="text-sm text-muted">
              Complete your first OSCE station to start tracking your clinical exam performance.
            </p>
          </GlassCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell backHref="/osce" title="OSCE Stats" subtitle="Track your clinical exam performance">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* A. Performance Overview */}
        <FadeSlide>
          <GlassCard>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Performance Overview
            </p>
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard label="Average Score" value={`${overall.averageScore}%`} accent />
              <StatCard label="Pass Rate" value={`${overall.passRate}%`} />
              <StatCard label="OSCEs Completed" value={overall.totalSessions.toString()} />
              <StatCard label="Best Score" value={`${overall.bestScore}%`} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Current Streak"
                value={`${streak.current} day${streak.current !== 1 ? "s" : ""}`}
                accent={streak.current > 0}
              />
              <StatCard
                label="Best Streak"
                value={`${streak.longest} day${streak.longest !== 1 ? "s" : ""}`}
              />
              <StatCard
                label="Consistency"
                value={`${consistency}%`}
              />
            </div>
          </GlassCard>
        </FadeSlide>

        {/* B. Difficulty Breakdown */}
        <FadeSlide delay={0.1}>
          <GlassCard>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Performance by Difficulty
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              {(["easy", "medium", "hard"] as const).map((d) => {
                const stat = difficultyStats[d];
                if (stat.sessions === 0) return null;
                return (
                  <div key={d}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                      {d}
                      <span className="ml-2 text-[10px] font-normal text-muted/60">
                        {stat.sessions} session{stat.sessions !== 1 ? "s" : ""}
                      </span>
                    </p>
                    <p className="text-3xl font-bold text-accent">{stat.averageScore}%</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </FadeSlide>

        {/* C. Domain Breakdown */}
        <FadeSlide delay={0.15}>
          <GlassCard>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Domain Breakdown
            </p>
            <div className="space-y-5">
              {domains.map((domain) => {
                const pct = domain.max > 0 ? (domain.average / domain.max) * 100 : 0;
                return (
                  <div key={domain.key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium">{domain.label}</span>
                      <span className="text-sm tabular-nums text-muted">
                        {domain.average.toFixed(1)}
                        <span className="text-xs text-muted/60">/{domain.max}</span>
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-border/60">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 60, damping: 20 }}
                        className={cn(
                          "h-full rounded-full",
                          pct >= 70
                            ? "bg-emerald-500"
                            : pct >= 50
                              ? "bg-amber-500"
                              : "bg-red-500",
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </FadeSlide>

        {/* D. Score Trend */}
        {trend.length >= 2 && (
          <FadeSlide delay={0.2}>
            <GlassCard>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
                Score Trend
              </p>
              <p className="mb-6 text-xs text-muted">
                Last {trend.length} OSCE{trend.length !== 1 ? "s" : ""}
                {improvement !== 0 && (
                  <span className={cn("ml-3", improvement > 0 ? "text-emerald-500" : "text-red-500")}>
                    {improvement > 0 ? "↑" : "↓"} {Math.abs(improvement)}% vs earlier sessions
                  </span>
                )}
              </p>
              <div className="flex items-end gap-1.5" style={{ height: 120 }}>
                {trend.map((point, i) => {
                  const heightPct = point.score;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 100, damping: 18 }}
                        style={{ maxHeight: 120 }}
                        className={cn(
                          "w-full max-w-[32px] rounded-t-md",
                          point.score >= 70
                            ? "bg-emerald-500/70"
                            : point.score >= 50
                              ? "bg-amber-500/70"
                              : "bg-red-500/70",
                        )}
                      />
                      <span className="text-[9px] text-muted/60">{formatDate(point.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </FadeSlide>
        )}

        {/* E. Weak Areas */}
        {weaknesses.length > 0 && (
          <FadeSlide delay={0.25}>
            <GlassCard>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
                Areas for Improvement
              </p>
              <p className="mb-6 text-xs text-muted">Detected from your OSCE performance patterns</p>
              <div className="space-y-3">
                {weaknesses.map((w, i) => (
                  <motion.div
                    key={`${w.type}-${w.label}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4",
                      w.severity === "high"
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-amber-500/20 bg-amber-500/5",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        w.severity === "high"
                          ? "bg-red-500/15 text-red-500"
                          : "bg-amber-500/15 text-amber-500",
                      )}
                    >
                      {w.severity === "high" ? "!" : "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{w.label}</p>
                      <p className="mt-0.5 text-xs text-muted">{w.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </FadeSlide>
        )}

        {/* F. Recent Sessions */}
        {recent.length > 0 && (
          <FadeSlide delay={0.3}>
            <GlassCard>
              <p className="mb-6 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
                Recent OSCE Sessions
              </p>
              <div className="space-y-2">
                {recent.map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-sm",
                      session.passed
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        session.passed
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-red-500/15 text-red-500",
                      )}
                    >
                      {session.passed ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{session.score}%</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                            session.difficulty === "easy"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : session.difficulty === "medium"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-red-500/10 text-red-500",
                          )}
                        >
                          {session.difficulty}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{formatDate(session.timestamp)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </FadeSlide>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-surface/50 p-4">
      <p className="text-xs text-muted">{label}</p>
      <motion.p
        className={cn(
          "mt-1 text-2xl font-bold",
          accent ? "text-accent" : "text-foreground",
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      >
        {value}
      </motion.p>
    </div>
  );
}
