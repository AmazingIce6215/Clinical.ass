"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, GlassCard } from "@/components/app-shell";
import { FadeSlide } from "@/components/motion";
import {
  getActivityHeatmapData,
  getOverallStats,
  getRecentAttempts,
  getStreak,
  getSubjectBreakdown,
  getWeakTopics,
} from "@/lib/teaching-stats";
import { teachingSubjects } from "@/lib/teaching-subjects";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StatsPage() {
  const overall = useMemo(() => getOverallStats(), []);
  const subjects = useMemo(() => getSubjectBreakdown(), []);
  const weakTopics = useMemo(() => getWeakTopics(), []);
  const streak = useMemo(() => getStreak(), []);
  const recent = useMemo(() => getRecentAttempts(10), []);
  const [heatmapYear] = useState(() => getActivityHeatmapData());

  const subjectMap = useMemo(() => {
    const map: Record<string, { name: string; icon: string }> = {};
    for (const s of teachingSubjects) {
      map[s.id] = { name: s.name, icon: s.icon };
    }
    return map;
  }, []);

  const streakActive = streak.current > 0;

  return (
    <AppShell backHref="/" title="Learning Stats" subtitle="Track your teaching mode performance">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* A. Overall Performance */}
        <FadeSlide>
          <GlassCard>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Overall Performance
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Questions Attempted"
                value={overall.totalAttempted.toString()}
              />
              <StatCard
                label="Overall Accuracy"
                value={`${overall.overallAccuracy}%`}
                accent
              />
              <StatCard
                label="Total Study Time"
                value={formatTime(overall.totalStudyTime)}
              />
            </div>
          </GlassCard>
        </FadeSlide>

        {/* B. Subject Breakdown */}
        <FadeSlide delay={0.1}>
          <GlassCard>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Subject Breakdown
            </p>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted">No subjects attempted yet. Start a teaching session!</p>
            ) : (
              <div className="space-y-4">
                {subjects.map((s: { id: string; name: string; icon: string; attempted: number; accuracy: number }) => {
                  const isWeakest = s.id === overall.weakest && subjects.length > 1;
                  const isStrongest = s.id === overall.strongest && subjects.length > 1;
                  return (
                    <Link key={s.id} href={`/stats/${s.id}`} className="group block">
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{s.icon}</span>
                          <span className="text-sm font-medium">{s.name}</span>
                          {isWeakest && (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                              Weakest
                            </span>
                          )}
                          {isStrongest && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                              Strongest
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {s.accuracy}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-border/60">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            s.accuracy >= 80
                              ? "bg-emerald-500"
                              : s.accuracy >= 60
                                ? "bg-amber-500"
                                : "bg-red-500",
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.accuracy}%` }}
                          transition={{ type: "spring", stiffness: 60, damping: 20 }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-[11px] text-muted">
                          {s.attempted} question{s.attempted !== 1 ? "s" : ""}
                        </p>
                        <span className="text-[11px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                          View analysis →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </FadeSlide>

        {/* C. Weak Topics Panel */}
        <FadeSlide delay={0.2}>
          <GlassCard>
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Weak Topics
            </p>
            <p className="mb-6 text-xs text-muted">
              Topics ranked by repeated incorrect answers
            </p>
            {weakTopics.length === 0 ? (
              <p className="text-sm text-muted">
                No weak topics detected. Keep answering to build your profile!
              </p>
            ) : (
              <div className="space-y-3">
                {weakTopics.map((topic, i) => (
                  <div
                    key={topic.topic}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/40 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                          i === 0
                            ? "bg-red-500/20 text-red-500"
                            : i === 1
                              ? "bg-amber-500/20 text-amber-500"
                              : "bg-surface text-muted",
                        )}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium capitalize">{topic.topic}</p>
                        <p className="text-xs text-muted">
                          {topic.incorrectCount} incorrect
                          {topic.totalAttempts > 0
                            ? ` · ${topic.accuracy}% accuracy`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      className="text-xs font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1",
                          topic.accuracy < 40
                            ? "bg-red-500/10 text-red-500"
                            : topic.accuracy < 70
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-emerald-500/10 text-emerald-500",
                        )}
                      >
                        {topic.accuracy < 40
                          ? "Needs work"
                          : topic.accuracy < 70
                            ? "Improving"
                            : "Getting there"}
                      </span>
                    </motion.div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </FadeSlide>

        {/* D. Streak + Heatmap */}
        <FadeSlide delay={0.3}>
          <GlassCard>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Study Streak
            </p>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Current Streak"
                value={`${streak.current} day${streak.current !== 1 ? "s" : ""}`}
                accent={streakActive}
              />
              <StatCard
                label="Best Streak"
                value={`${streak.longest} day${streak.longest !== 1 ? "s" : ""}`}
              />
              <StatCard
                label="Last Active"
                value={
                  streak.lastActiveDate
                    ? new Date(streak.lastActiveDate + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )
                    : "Never"
                }
              />
            </div>

            {/* Activity Heatmap */}
            <p className="mb-4 text-sm font-medium text-muted">
              Activity — last 12 months
            </p>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-0.5">
                {months(heatmapYear).map((month, mi) => (
                  <div key={mi} className="flex flex-col gap-0.5">
                    <p className="mb-1 text-[9px] font-medium text-muted">{month.label}</p>
                    <div className="grid grid-flow-row gap-0.5" style={{ gridTemplateRows: `repeat(${month.rows}, 1fr)` }}>
                      {month.days.map((day, di) => (
                        <motion.div
                          key={`${mi}-${di}`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (mi * month.days.length + di) * 0.001 }}
                          className={cn(
                            "h-2.5 w-2.5 rounded-[3px] sm:h-3 sm:w-3",
                            day.level === 0 && "bg-border/20",
                            day.level === 1 && "bg-accent/20",
                            day.level === 2 && "bg-accent/40",
                            day.level === 3 && "bg-accent/65",
                            day.level === 4 && "bg-accent",
                          )}
                          title={`${day.date}: ${day.count} questions`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded-[3px] bg-border/20" />
              <div className="h-2.5 w-2.5 rounded-[3px] bg-accent/20" />
              <div className="h-2.5 w-2.5 rounded-[3px] bg-accent/40" />
              <div className="h-2.5 w-2.5 rounded-[3px] bg-accent/65" />
              <div className="h-2.5 w-2.5 rounded-[3px] bg-accent" />
              <span>More</span>
            </div>
          </GlassCard>
        </FadeSlide>

        {/* E. Recent Activity */}
        <FadeSlide delay={0.4}>
          <GlassCard>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Recent Activity
            </p>
            {recent.length === 0 ? (
              <p className="text-sm text-muted">No questions answered yet. Head to Teaching Mode!</p>
            ) : (
              <div className="space-y-2">
                {recent.map((attempt, i) => (
                  <motion.div
                    key={`${attempt.questionId}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-sm",
                      attempt.correct
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        attempt.correct
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-red-500/15 text-red-500",
                      )}
                    >
                      {attempt.correct ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium capitalize">
                          {subjectMap[attempt.subject]?.name ?? attempt.subject}
                        </span>
                        <span className="text-[10px] text-muted">
                          {attempt.difficulty}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {formatDate(attempt.timestamp)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {attempt.timeTaken < 60
                        ? `${attempt.timeTaken}s`
                        : `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s`}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </FadeSlide>
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
          "mt-1 text-2xl font-bold tabular-nums",
          accent && "text-accent",
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {value}
      </motion.p>
    </div>
  );
}



function months(
  data: Array<{ date: string; count: number; level: number }>,
) {
  if (data.length === 0) return [];
  const monthMap: Record<
    string,
    { label: string; days: typeof data; rows: number }
  > = {};

  const firstDate = new Date(data[0].date);
  const startDay = firstDate.getDay();

  let idx = 0;
  for (const d of data) {
    const dt = new Date(d.date);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const label = dt.toLocaleDateString("en-US", { month: "short" });

    if (!monthMap[key]) {
      monthMap[key] = { label, days: [], rows: 7 };
      for (let p = 0; p < (idx === 0 ? startDay : 0); p++) {
        monthMap[key].days.push({ date: "", count: 0, level: 0 });
      }
    }
    monthMap[key].days.push(d);
    idx++;
  }

  return Object.values(monthMap);
}
