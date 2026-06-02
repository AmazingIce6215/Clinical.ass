"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, GlassCard } from "@/components/app-shell";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { teachingSubjects } from "@/lib/teaching-subjects";
import { getFavorites } from "@/lib/teaching-storage";
import type { GeneratedTeachingCase } from "@/lib/types";

export default function TeachingPage() {
  const [favorites, setFavorites] = useState<GeneratedTeachingCase[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  return (
    <AppShell
      backHref="/"
      title="Teaching Mode"
      subtitle="Pick a subject — AI generates a fresh case every time"
    >
      {favorites.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">★ Favorites</h2>
            <Link href="/teaching/favorites" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {favorites.slice(0, 5).map((c) => (
              <Link key={c.id} href={`/teaching/favorites?id=${c.id}`}>
                <GlassCard hover className="min-w-[220px] cursor-pointer">
                  <p className="text-xs text-muted">{c.subjectName}</p>
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
                <h2 className="mt-3 text-lg font-semibold group-hover:text-accent transition-colors">
                  {subject.name}
                </h2>
                <p className="mt-2 text-sm text-muted">{subject.description}</p>
                <p className="mt-4 text-xs font-medium text-accent">
                  Generate new case →
                </p>
              </GlassCard>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </AppShell>
  );
}
