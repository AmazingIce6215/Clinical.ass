"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell, GlassCard } from "@/components/app-shell";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { searchLibrary } from "@/lib/case-library";
import { teachingSubjects } from "@/lib/teaching-subjects";
import { getUserStats } from "@/lib/teaching-stats";


export default function TeachingPage() {
  const saved = useMemo(() => searchLibrary("", "teaching"), []);
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
        {teachingSubjects.map((subject) => (
          <StaggerItem key={subject.id}>
            <Link href={`/teaching/${subject.id}`}>
              <GlassCard hover className="group h-full cursor-pointer">
                <span className="text-3xl">{subject.icon}</span>
                <h2 className="mt-3 text-lg font-semibold transition-colors group-hover:text-accent">
                  {subject.name}
                </h2>
                <p className="mt-2 text-sm text-muted">{subject.description}</p>
                <p className="mt-4 text-xs font-medium text-accent">Generate new session →</p>
              </GlassCard>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </AppShell>
  );
}
