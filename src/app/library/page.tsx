"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell, ButtonLink, GlassCard, SecondaryButton } from "@/components/app-shell";
import { CasePlayer } from "@/components/teaching/case-player";
import {
  clearLibrary,
  getLibraryItem,
  removeFromLibrary,
  searchLibrary,
} from "@/lib/case-library";
import type { CaseMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<CaseMode, string> = {
  clinical: "Clincalass",
  classic: "Classic",
  teaching: "Teaching",
};

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get("id");
  const modeFilter = (searchParams.get("mode") as CaseMode) || undefined;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CaseMode | "all">(modeFilter ?? "all");
  const [refreshCounter, setRefreshCounter] = useState(0);

  const items = useMemo(() => {
    void refreshCounter;
    return searchLibrary(query, filter === "all" ? undefined : filter);
  }, [query, filter, refreshCounter]);

  const active = useMemo(() => {
    void refreshCounter;
    return viewId ? getLibraryItem(viewId) ?? null : null;
  }, [viewId, refreshCounter]);

  const refreshItems = useCallback(() => {
    setRefreshCounter((count) => count + 1);
  }, []);

  const exitDetail = useCallback(() => {
    router.replace("/library");
  }, [router]);

  const handleRemove = (id: string) => {
    removeFromLibrary(id);
    refreshItems();
    if (viewId === id) exitDetail();
  };

  const handleClearAll = () => {
    if (!items.length) return;
    if (!window.confirm(`Remove all ${items.length} saved cases? This cannot be undone.`)) return;
    clearLibrary();
    setRefreshCounter((count) => count + 1);
    router.replace("/library");
  };

  if (active?.teachingCase) {
    return (
      <CasePlayer
        teachingCase={active.teachingCase}
        onBack={exitDetail}
      />
    );
  }

  if (active?.patientCase && active.mode === "clinical" && active.diagnosis) {
    const redFlags = active.diagnosis.redFlags.map((r) =>
      typeof r === "string" ? r : `${r.flag} — ${r.whyItMatters}`,
    );
    return (
      <AppShell onBack={exitDetail} title={active.title}>
        <div className="max-w-3xl space-y-4">
          <GlassCard>
            <p className="text-xs font-semibold uppercase text-accent">Primary diagnosis</p>
            <h2 className="mt-2 text-xl font-semibold">{active.diagnosis.primaryDiagnosis}</h2>
            <p className="mt-3 text-sm text-muted">{active.diagnosis.clinicalReasoningSummary}</p>
          </GlassCard>
          <GlassCard>
            <h3 className="mb-2 font-semibold">Red flags</h3>
            <ul className="space-y-1 text-sm text-muted">
              {redFlags.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </GlassCard>
          <ButtonLink href="/clinical">New clinical case</ButtonLink>
        </div>
      </AppShell>
    );
  }

  if (active?.presentation) {
    return (
      <AppShell onBack={exitDetail} title={active.title}>
        <GlassCard className="max-w-3xl">
          <p className="font-medium">{active.presentation.oneLiner}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted">
            {active.presentation.fullPresentation}
          </p>
          <ButtonLink href="/classic" className="mt-6 inline-flex">
            New classic case
          </ButtonLink>
        </GlassCard>
      </AppShell>
    );
  }

  return (
    <AppShell backHref="/" title="Case Library" subtitle="Your saved cases">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, complaint, subject..."
          className="flex-1 rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none focus:border-accent/50"
        />
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(["all", "clinical", "classic", "teaching"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilter(m)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition sm:px-3 sm:text-xs",
                filter === m ? "bg-accent text-accent-foreground" : "border border-border/60 bg-surface",
              )}
            >
              {m === "all" ? "All" : MODE_LABELS[m]}
            </button>
          ))}
          {items.length > 0 && (
            <SecondaryButton
              onClick={handleClearAll}
              className="px-2.5 py-1.5 text-[11px] text-red-600 dark:text-red-400 sm:px-3 sm:text-xs"
            >
              Clear
            </SecondaryButton>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <GlassCard className="text-center">
          <p className="text-muted">No saved cases yet.</p>
          <p className="mt-2 text-sm text-muted">
            Complete a case and tap &quot;Save to library&quot; or ☆ in teaching mode.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <GlassCard key={c.id} className="flex flex-col max-sm:p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">
                  {MODE_LABELS[c.mode]}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(c.id)}
                  className="text-xs text-muted hover:text-red-500"
                >
                  Remove
                </button>
              </div>
              <Link href={`/library?id=${c.id}`} className="mt-2 flex-1">
                <h3 className="font-semibold hover:text-accent">{c.title}</h3>
                {c.subject && <p className="mt-1 text-xs text-muted">{c.subject}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
              <p className="mt-3 text-[10px] text-muted">
                {new Date(c.savedAt).toLocaleDateString()}
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <AppShell backHref="/">
          <p className="text-muted">Loading...</p>
        </AppShell>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
