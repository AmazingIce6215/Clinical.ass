"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { motion } from "framer-motion";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell, GlassCard, SecondaryButton } from "@/components/app-shell";
import { FadeSlide } from "@/components/motion";
import {
  getSubjectAiInsight,
  getSubjectAttemptsForAnalysis,
  getSubjectBreakdown,
  getWeakTopics,
  needsAnalysis,
  setSubjectAiInsight,
} from "@/lib/teaching-stats";
import { getSubject } from "@/lib/teaching-subjects";
import type { SubjectAiInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SubjectStatsPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: subjectId } = use(params);
  const subjectInfo = getSubject(subjectId);
  const [insight, setInsight] = useState<SubjectAiInsight | null>(
    () => !needsAnalysis(subjectId) ? getSubjectAiInsight(subjectId) : null,
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  const allSubjects = getSubjectBreakdown();
  const subjectStats = allSubjects.find((s) => s.id === subjectId);
  const weakTopics = getWeakTopics().filter(
    (t) => subjectId === "all" || t.topic.toLowerCase().includes(subjectId),
  );

  const needsRefresh = !insight && !analyzing && !error;

  const runAnalysis = useCallback(async () => {
    if (!subjectInfo || !subjectStats) return;
    setAnalyzing(true);
    setError(null);
    try {
      const attempts = getSubjectAttemptsForAnalysis(subjectId);
      if (attempts.length === 0) {
        setError("Not enough data to analyze. Answer more questions first.");
        return;
      }
      const res = await fetch("/api/teaching/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectId,
          subjectName: subjectInfo.name,
          attempts: attempts.map((a) => ({
            vignette: a.vignette,
            prompt: a.prompt,
            options: a.options,
            correctAnswerText: a.correctAnswerText,
            userAnswerText: a.userAnswerText,
            correct: a.correct,
            timeTaken: a.timeTaken,
            difficulty: a.difficulty,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Analysis failed");
        return;
      }
      const data = await res.json();
      setSubjectAiInsight(subjectId, data.insight);
      setInsight(data.insight);
      setError(null);
    } catch {
      setError("Network error — check your connection");
    } finally {
      setAnalyzing(false);
    }
  }, [subjectId, subjectInfo, subjectStats]);

  useEffect(() => {
    if (initRef.current || !subjectInfo || !subjectStats) return;
    initRef.current = true;
    if (needsRefresh) {
      runAnalysis();
    }
  }, [subjectInfo, subjectStats, needsRefresh, runAnalysis]);

  if (!subjectInfo) notFound();

  return (
    <AppShell
      backHref="/stats"
      title={subjectInfo.name}
      subtitle={`${subjectInfo.description}`}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header stats */}
        <FadeSlide>
          <GlassCard>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{subjectInfo.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
                      Performance
                    </p>
                    {subjectStats ? (
                      <div className="mt-3 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted">Accuracy</p>
                          <p className="text-2xl font-bold tabular-nums text-accent">
                            {subjectStats.accuracy}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Attempted</p>
                          <p className="text-2xl font-bold tabular-nums">
                            {subjectStats.attempted}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Correct</p>
                          <p className="text-2xl font-bold tabular-nums text-emerald-500">
                            {subjectStats.correct}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted">
                        No questions attempted in this subject yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {subjectStats && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-border/60">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    subjectStats.accuracy >= 80
                      ? "bg-emerald-500"
                      : subjectStats.accuracy >= 60
                        ? "bg-amber-500"
                        : "bg-red-500",
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${subjectStats.accuracy}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 20 }}
                />
              </div>
            )}
          </GlassCard>
        </FadeSlide>

        {/* Weak Topics */}
        {weakTopics.length > 0 && (
          <FadeSlide delay={0.1}>
            <GlassCard>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
                Weak Topics
              </p>
              <div className="space-y-2">
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
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
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
                  </div>
                ))}
              </div>
            </GlassCard>
          </FadeSlide>
        )}

        {/* AI Analysis */}
        <FadeSlide delay={0.2}>
          <GlassCard>
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              AI Performance Analysis
            </p>

            {/* Analyzing state */}
            {analyzing && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/40 bg-surface/40 px-5 py-4">
                <motion.div
                  className="h-5 w-5 shrink-0 rounded-full border-2 border-accent/30 border-t-accent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div>
                  <p className="text-sm font-medium">Analyzing your performance...</p>
                  <p className="text-xs text-muted">
                    Reviewing your answers to identify strengths and weaknesses
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !analyzing && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
                <SecondaryButton onClick={runAnalysis}>Retry analysis</SecondaryButton>
              </div>
            )}

            {/* Cached insight */}
            {insight && !analyzing && (
              <div className="mt-4 space-y-4">
                {/* Strengths */}
                {insight.strengths.length > 0 && (
                  <div>
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-500">
                      <span>✓</span> Strengths
                    </p>
                    <div className="space-y-2">
                      {insight.strengths.map((s, i) => (
                        <div key={i} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
                          <p className="text-sm font-medium text-foreground">{s.area}</p>
                          <p className="mt-0.5 text-xs text-muted">{s.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weaknesses */}
                {insight.weaknesses.length > 0 && (
                  <div>
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-500">
                      <span>⚠</span> Areas to improve
                    </p>
                    <div className="space-y-2">
                      {insight.weaknesses.map((w, i) => (
                        <div
                          key={i}
                          className={cn(
                            "rounded-lg border p-3",
                            w.severity === "high"
                              ? "border-red-500/20 bg-red-500/5"
                              : w.severity === "medium"
                                ? "border-amber-500/20 bg-amber-500/5"
                                : "border-yellow-500/20 bg-yellow-500/5",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{w.area}</p>
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                                w.severity === "high"
                                  ? "bg-red-500/15 text-red-500"
                                  : w.severity === "medium"
                                    ? "bg-amber-500/15 text-amber-500"
                                    : "bg-yellow-500/15 text-yellow-500",
                              )}
                            >
                              {w.severity}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">{w.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {insight.recommendations.length > 0 && (
                  <div>
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                      <span>→</span> Recommendations
                    </p>
                    <ol className="space-y-1.5">
                      {insight.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                            {i + 1}
                          </span>
                          <span className="text-muted">{r}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border/20 pt-4">
                  <p className="text-[10px] text-muted">
                    Analyzed {new Date(insight.generatedAt).toLocaleDateString()}
                  </p>
                  <button
                    type="button"
                    onClick={runAnalysis}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Refresh analysis
                  </button>
                </div>
              </div>
            )}

            {/* No data yet */}
            {!subjectStats && (
              <p className="mt-4 text-sm text-muted">
                Answer some questions in teaching mode to get a performance analysis.
              </p>
            )}
          </GlassCard>
        </FadeSlide>
      </div>
    </AppShell>
  );
}
