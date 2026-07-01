"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell, GlassCard } from "@/components/app-shell";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { searchLibrary } from "@/lib/case-library";
import { teachingSubjects } from "@/lib/teaching-subjects";
import { getSubjectStatsMap, getUserStats } from "@/lib/teaching-stats";
import { cn } from "@/lib/utils";

export default function TeachingPage() {
  const saved = useMemo(() => searchLibrary("", "teaching"), []);
  const subjectStatsMap = useMemo(() => getSubjectStatsMap(), []);
  const totalAttempted = useMemo(() => {
    const stats = getUserStats();
    return Object.values(stats.subjectStats).reduce((s, v) => s + v.attempted, 0);
  }, []);

  return (
    <AppShell
      backHref="/"
      title="Teaching Mode"
      subtitle="Case-based learning that feels like a modern study dashboard"
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <GlassCard className="glass-card--hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="shell-kicker">Adaptive learning</p>
              <h1 className="shell-heading mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                Train your pattern recognition with a cleaner, calmer study flow.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                Each session gives you three fresh patients. The layout is built to keep momentum,
                reduce friction, and let the explanation do the teaching.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[22rem]">
              <div className="metric-tile">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Questions</p>
                <p className="metric-value mt-2">{totalAttempted}</p>
              </div>
              <div className="metric-tile">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Saved cases</p>
                <p className="metric-value mt-2">{saved.length}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {totalAttempted > 0 && (
          <Link href="/stats">
            <GlassCard hover className="glass-card--action flex items-center justify-between gap-4">
              <div>
                <p className="shell-kicker">Learning progress</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                  View your performance analytics
                </p>
                <p className="mt-1 text-sm text-muted">
                  {totalAttempted} question{totalAttempted !== 1 ? "s" : ""} answered
                </p>
              </div>
              <span className="ui-pill ui-pill--accent">Open stats</span>
            </GlassCard>
          </Link>
        )}

        {saved.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="shell-kicker">Saved in library</p>
                <h2 className="shell-heading mt-1 text-2xl font-semibold tracking-[-0.04em]">
                  Continue where you left off
                </h2>
              </div>
              <Link href="/library?mode=teaching" className="ui-pill ui-pill--accent">
                View all saved
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {saved.slice(0, 5).map((c) => (
                <Link key={c.id} href={`/library?id=${c.id}`}>
                  <GlassCard hover className="min-w-[220px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      {c.subject}
                    </p>
                    <p className="mt-3 text-base font-semibold tracking-[-0.03em]">{c.title}</p>
                    <p className="mt-2 text-sm text-muted">Open the saved teaching case</p>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="shell-kicker">Subjects</p>
              <h2 className="shell-heading mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                Choose a subject
              </h2>
            </div>
            <p className="hidden max-w-sm text-sm leading-6 text-muted sm:block">
              Each subject builds around high-frequency clinical patterns so the questions stay relevant
              and practical.
            </p>
          </div>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teachingSubjects.map((subject) => {
              const s = subjectStatsMap[subject.id];
              const hasData = s.attempted > 0;
              return (
                <StaggerItem key={subject.id}>
                  <Link href={`/teaching/${subject.id}`}>
                    <GlassCard hover className="module-card glass-card--action h-full">
                      <div className="flex items-start justify-between gap-4">
                        <span className="module-card__icon text-2xl">{subject.icon}</span>
                        {hasData && (
                          <span
                            className={cn(
                              "ui-pill",
                              s.accuracy >= 70
                                ? "border-emerald-500/30 text-emerald-500"
                                : s.accuracy >= 40
                                  ? "border-amber-500/30 text-amber-500"
                                  : "border-red-500/30 text-red-500",
                            )}
                          >
                            {s.accuracy}%
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="module-card__title">{subject.name}</h3>
                        <p className="module-card__desc">{subject.description}</p>
                        {hasData && (
                          <p className="text-xs text-muted">
                            {s.attempted} question{s.attempted !== 1 ? "s" : ""} · {s.correct} correct
                          </p>
                        )}
                      </div>
                      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                        Generate session
                        <span aria-hidden="true">→</span>
                      </span>
                    </GlassCard>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>
      </div>
    </AppShell>
  );
}
