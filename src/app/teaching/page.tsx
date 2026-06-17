"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell, GlassCard } from "@/components/app-shell";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { searchLibrary } from "@/lib/case-library";
import { teachingSubjects } from "@/lib/teaching-subjects";
import { getSubjectStatsMap, getUserStats } from "@/lib/teaching-stats";


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
      subtitle="3 unique patients per session — MCQs with explanations"
    >
      {totalAttempted > 0 && (
        <section className="mb-4 sm:mb-6">
          <Link href="/stats">
            <GlassCard hover className="cursor-pointer max-sm:p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-accent max-sm:text-xs">View Your Learning Stats →</p>
                  <p className="mt-0.5 text-xs text-muted max-sm:text-[11px]">
                    {totalAttempted} question{totalAttempted !== 1 ? "s" : ""} answered
                  </p>
                </div>
                <span className="text-xl sm:text-2xl">📊</span>
              </div>
            </GlassCard>
          </Link>
        </section>
      )}

      {saved.length > 0 && (
        <section className="mb-6 sm:mb-10">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h2 className="text-base font-semibold sm:text-lg">★ Saved in library</h2>
            <Link href="/library?mode=teaching" className="text-xs text-accent hover:underline sm:text-sm">
              View all
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3">
            {saved.slice(0, 5).map((c) => (
              <Link key={c.id} href={`/library?id=${c.id}`}>
                <GlassCard hover className="min-w-[180px] cursor-pointer max-sm:p-3 sm:min-w-[220px]">
                  <p className="text-[11px] text-muted sm:text-xs">{c.subject}</p>
                  <p className="mt-1 text-sm font-medium sm:text-base">{c.title}</p>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Choose a subject</h2>
      <StaggerContainer className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teachingSubjects.map((subject) => {
          const s = subjectStatsMap[subject.id];
          const hasData = s.attempted > 0;
          return (
            <StaggerItem key={subject.id}>
              <Link href={`/teaching/${subject.id}`}>
                <GlassCard hover className="group h-full cursor-pointer max-sm:p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl sm:text-3xl">{subject.icon}</span>
                    {hasData && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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
                  <h2 className="mt-2 text-base font-semibold transition-colors group-hover:text-accent sm:mt-3 sm:text-lg">
                    {subject.name}
                  </h2>
                  <p className="mt-1 text-xs text-muted sm:mt-2 sm:text-sm">{subject.description}</p>
                  {hasData && (
                    <p className="mt-1 text-[11px] text-muted sm:mt-2 sm:text-xs">
                      {s.attempted} question{s.attempted !== 1 ? "s" : ""} · {s.correct} correct
                    </p>
                  )}
                  <p className="mt-2 text-[11px] font-medium text-accent sm:mt-4 sm:text-xs">Generate new session →</p>
                </GlassCard>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </AppShell>
  );
}
