"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AppShell, GlassCard } from "@/components/app-shell";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { searchLibrary } from "@/lib/case-library";
import { teachingSubjects } from "@/lib/teaching-subjects";
import {
  getSubjectAiInsight,
  getSubjectAttemptsForAnalysis,
  getSubjectStatsMap,
  getUserStats,
  needsAnalysis,
  setSubjectAiInsight,
} from "@/lib/teaching-stats";
import type { SubjectAiInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TeachingPage() {
  const saved = useMemo(() => searchLibrary("", "teaching"), []);
  const subjectStatsMap = useMemo(() => getSubjectStatsMap(), []);
  const totalAttempted = useMemo(() => {
    const stats = getUserStats();
    return Object.values(stats.subjectStats).reduce((s, v) => s + v.attempted, 0);
  }, []);

  const [insightSubject, setInsightSubject] = useState<string | null>(null);
  const [insightsCache, setInsightsCache] = useState<Record<string, SubjectAiInsight>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const selectedSubject = useMemo(
    () => teachingSubjects.find((s) => s.id === insightSubject) ?? null,
    [insightSubject],
  );

  const selectedStats = useMemo(
    () => (insightSubject ? subjectStatsMap[insightSubject] : null),
    [insightSubject],
  );

  const openInsights = useCallback((subjectId: string) => {
    setInsightSubject(subjectId);
    const cached = getSubjectAiInsight(subjectId);
    if (cached) {
      setInsightsCache((prev) => ({ ...prev, [subjectId]: cached }));
    }
    if (!needsAnalysis(subjectId)) return;
    setAnalysisError(null);
    setAnalyzing(true);
    const info = teachingSubjects.find((s) => s.id === subjectId);
    if (!info) return;
    (async () => {
      try {
        const attempts = getSubjectAttemptsForAnalysis(subjectId);
        if (attempts.length === 0) {
          setAnalyzing(false);
          return;
        }
        const res = await fetch("/api/teaching/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: subjectId,
            subjectName: info.name,
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
          setAnalysisError(data.error ?? "Analysis failed");
          setAnalyzing(false);
          return;
        }
        const data = await res.json();
        setSubjectAiInsight(subjectId, data.insight);
        setInsightsCache((prev) => ({ ...prev, [subjectId]: data.insight }));
        setAnalyzing(false);
      } catch {
        setAnalysisError("Network error");
        setAnalyzing(false);
      }
    })();
  }, []);

  const closeInsights = useCallback(() => {
    setInsightSubject(null);
    setAnalysisError(null);
    setAnalyzing(false);
  }, []);

  const insight = insightSubject ? insightsCache[insightSubject] ?? null : null;

  return (
    <AppShell
      backHref="/"
      title="Teaching Mode"
      subtitle="3 unique patients per session — MCQs with explanations"
    >
      {totalAttempted > 0 && (
        <section className="mb-6">
          <Link href="/stats">
            <GlassCard hover className="cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-accent">View Your Learning Stats →</p>
                  <p className="mt-1 text-xs text-muted">
                    {totalAttempted} question{totalAttempted !== 1 ? "s" : ""} answered
                  </p>
                </div>
                <span className="text-2xl">📊</span>
              </div>
            </GlassCard>
          </Link>
        </section>
      )}

      {saved.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">★ Saved in library</h2>
            <Link href="/library?mode=teaching" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {saved.slice(0, 5).map((c) => (
              <Link key={c.id} href={`/library?id=${c.id}`}>
                <GlassCard hover className="min-w-[220px] cursor-pointer">
                  <p className="text-xs text-muted">{c.subject}</p>
                  <p className="mt-1 font-medium">{c.title}</p>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-4 text-lg font-semibold">Choose a subject</h2>
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teachingSubjects.map((subject) => {
          const s = subjectStatsMap[subject.id];
          const hasData = s.attempted > 0;
          return (
            <StaggerItem key={subject.id}>
              <button
                type="button"
                onClick={() => openInsights(subject.id)}
                className="h-full w-full text-left"
              >
                <GlassCard hover className="group h-full cursor-pointer">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{subject.icon}</span>
                    {hasData && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s.accuracy >= 70
                            ? "bg-emerald-500/10 text-emerald-500"
                            : s.accuracy >= 40
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {s.accuracy}%
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold transition-colors group-hover:text-accent">
                    {subject.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{subject.description}</p>
                  {hasData && (
                    <p className="mt-2 text-xs text-muted">
                      {s.attempted} question{s.attempted !== 1 ? "s" : ""} · {s.correct} correct
                    </p>
                  )}
                  <p className="mt-4 text-xs font-medium text-accent">View insights →</p>
                </GlassCard>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Insights Modal */}
      <AnimatePresence>
        {insightSubject && selectedSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={closeInsights}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/60 bg-surface p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedSubject.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedSubject.name}</h3>
                    {selectedStats && selectedStats.attempted > 0 && (
                      <p className="text-xs text-muted">
                        {selectedStats.attempted} question{selectedStats.attempted !== 1 ? "s" : ""} ·{" "}
                        {selectedStats.accuracy}% accuracy
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeInsights}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-sm text-muted transition hover:bg-surface/80"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              {analyzing && (
                <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface/40 px-4 py-3">
                  <motion.div
                    className="h-4 w-4 shrink-0 rounded-full border-2 border-accent/30 border-t-accent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-sm text-muted">Analyzing your performance...</p>
                </div>
              )}

              {analysisError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                  {analysisError}
                </div>
              )}

              {!selectedStats?.attempted && !analyzing && (
                <div className="rounded-xl border border-border/40 bg-surface/30 p-6 text-center">
                  <p className="text-sm text-muted">No questions answered yet for this subject.</p>
                </div>
              )}

              {insight && !analyzing && (
                <SubjectInsightPanel insight={insight} />
              )}

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3 border-t border-border/20 pt-5">
                <Link
                  href={`/teaching/${insightSubject}`}
                  onClick={closeInsights}
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
                >
                  New session
                </Link>
                <Link
                  href="/stats"
                  onClick={closeInsights}
                  className="inline-flex items-center justify-center rounded-xl border border-border/50 px-5 py-2.5 text-sm font-medium text-muted transition hover:bg-surface/80"
                >
                  Full stats
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function SubjectInsightPanel({ insight }: { insight: SubjectAiInsight }) {
  return (
    <div className="space-y-4">
      {insight.strengths.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-500">
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

      {insight.weaknesses.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-500">
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

      {insight.recommendations.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
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

      <div className="border-t border-border/20 pt-3 text-[10px] text-muted">
        Analyzed {new Date(insight.generatedAt).toLocaleDateString()}
      </div>
    </div>
  );
}
