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
  clinical: "Clinical",
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
    return <CasePlayer teachingCase={active.teachingCase} onBack={exitDetail} />;
  }

  if (active?.patientCase && active.mode === "clinical" && active.diagnosis) {
    const redFlags = active.diagnosis.redFlags.map((r) =>
      typeof r === "string" ? r : `${r.flag} — ${r.whyItMatters}`,
    );
    return (
      <AppShell onBack={exitDetail} title={active.title} subtitle="Clinical case review">
        <div className="mx-auto max-w-4xl space-y-4">
          <GlassCard className="glass-card--hero">
            <p className="shell-kicker">Primary diagnosis</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{active.diagnosis.primaryDiagnosis}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{active.diagnosis.clinicalReasoningSummary}</p>
          </GlassCard>
          <GlassCard>
            <p className="shell-kicker">Red flags</p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {redFlags.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </GlassCard>
          <ButtonLink href="/clinical" variant="primary">
            New clinical case
          </ButtonLink>
        </div>
      </AppShell>
    );
  }

  if (active?.presentation) {
    return (
      <AppShell onBack={exitDetail} title={active.title} subtitle="Classic case presentation">
        <GlassCard className="mx-auto max-w-4xl glass-card--hero">
          <p className="text-base font-medium">{active.presentation.oneLiner}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">
            {active.presentation.fullPresentation}
          </p>
          <ButtonLink href="/classic" variant="primary" className="mt-6 inline-flex">
            New classic case
          </ButtonLink>
        </GlassCard>
      </AppShell>
    );
  }

  return (
    <AppShell backHref="/" title="Case Library" subtitle="Your saved cases and presentations">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <GlassCard className="glass-card--hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="shell-kicker">Saved workspace</p>
              <h1 className="shell-heading mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                A refined archive for the cases you want to revisit.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                Search by title, complaint, or mode. Saved material stays easy to scan and easy to
                reopen.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[22rem]">
              <div className="metric-tile">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Items</p>
                <p className="metric-value mt-2">{items.length}</p>
              </div>
              <div className="metric-tile">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Filter</p>
                <p className="metric-value mt-2">{filter === "all" ? "All" : MODE_LABELS[filter]}</p>
              </div>
              <div className="metric-tile">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Search</p>
                <p className="metric-value mt-2">{query.trim() ? "On" : "Off"}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, complaint, subject..."
              className="w-full rounded-2xl border border-border/80 bg-surface/75 px-4 py-3 text-sm outline-none transition placeholder:text-muted/55 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "clinical", "classic", "teaching"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFilter(m)}
                className={cn(
                  "ui-pill",
                  filter === m && "ui-pill--accent border-accent/30 text-foreground",
                )}
              >
                {m === "all" ? "All" : MODE_LABELS[m]}
              </button>
            ))}
            {items.length > 0 && (
              <SecondaryButton onClick={handleClearAll} className="px-4 py-3 text-xs text-red-600 dark:text-red-400">
                Clear all
              </SecondaryButton>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <GlassCard className="py-16 text-center">
            <p className="text-lg font-semibold">No saved cases yet</p>
            <p className="mt-2 text-sm text-muted">
              Complete a case and save it to revisit later.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((c) => (
              <GlassCard key={c.id} hover className="module-card glass-card--action flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="ui-pill ui-pill--accent">{MODE_LABELS[c.mode]}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(c.id)}
                    className="text-xs font-medium text-muted transition hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <Link href={`/library?id=${c.id}`} className="flex-1">
                  <h3 className="module-card__title">{c.title}</h3>
                  {c.subject && <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{c.subject}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.tags.slice(0, 3).map((t) => (
                      <span key={t} className="ui-pill text-[10px] uppercase tracking-[0.14em]">
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
                <p className="text-xs text-muted">
                  {new Date(c.savedAt).toLocaleDateString()}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
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
