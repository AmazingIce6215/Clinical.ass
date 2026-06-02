"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppShell, GlassCard } from "@/components/app-shell";
import { CasePlayer } from "@/components/teaching/case-player";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { getFavorite, getFavorites } from "@/lib/teaching-storage";
import type { GeneratedTeachingCase } from "@/lib/types";

function FavoritesContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("id");
  const [favorites, setFavorites] = useState<GeneratedTeachingCase[]>([]);
  const [activeCase, setActiveCase] = useState<GeneratedTeachingCase | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
    if (caseId) {
      setActiveCase(getFavorite(caseId) ?? null);
    }
  }, [caseId]);

  if (activeCase) {
    return (
      <CasePlayer
        teachingCase={activeCase}
        backHref="/teaching/favorites"
      />
    );
  }

  return (
    <AppShell backHref="/teaching" title="Favorites" subtitle="Your saved cases">
      {favorites.length === 0 ? (
        <GlassCard className="mx-auto max-w-md text-center">
          <p className="text-muted">No favorites yet.</p>
          <p className="mt-2 text-sm text-muted">
            Tap ☆ on any case while studying to save it here.
          </p>
          <Link href="/teaching" className="mt-4 inline-block text-sm text-accent hover:underline">
            Browse subjects →
          </Link>
        </GlassCard>
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2">
          {favorites.map((c) => (
            <StaggerItem key={c.id}>
              <Link href={`/teaching/favorites?id=${c.id}`}>
                <GlassCard hover className="cursor-pointer">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    {c.subjectName}
                  </p>
                  <h2 className="mt-2 font-semibold">{c.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{c.vignette}</p>
                  <p className="mt-3 text-xs text-muted">
                    {c.questions.length} questions · ★ Saved
                  </p>
                </GlassCard>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </AppShell>
  );
}

export default function FavoritesPage() {
  return (
    <Suspense
      fallback={
        <AppShell backHref="/teaching" title="Favorites">
          <p className="text-muted">Loading...</p>
        </AppShell>
      }
    >
      <FavoritesContent />
    </Suspense>
  );
}
