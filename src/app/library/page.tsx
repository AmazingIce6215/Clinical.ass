"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderOpen, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, ButtonLink, EmptyState, Notice, PageHeader, Surface } from "@/components/ui/primitives";
import { CasePlayer } from "@/components/teaching/case-player";
import { clearLibrary, getLibraryItem, removeFromLibrary, searchLibrary } from "@/lib/case-library";
import type { CaseMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<CaseMode, string> = { clinical: "Clinical", classic: "Classic", teaching: "Teaching" };

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get("id");
  const requestedMode = searchParams.get("mode") as CaseMode | null;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CaseMode | "all">(
    requestedMode && requestedMode in MODE_LABELS ? requestedMode : "all",
  );
  const [version, setVersion] = useState(0);

  const items = useMemo(() => {
    void version;
    return searchLibrary(query, filter === "all" ? undefined : filter);
  }, [filter, query, version]);
  const active = useMemo(() => {
    void version;
    return viewId ? getLibraryItem(viewId) ?? null : null;
  }, [version, viewId]);
  const closeDetail = useCallback(() => router.replace("/library"), [router]);

  if (active?.teachingCase) return <CasePlayer teachingCase={active.teachingCase} onBack={closeDetail} />;

  if (active?.patientCase && active.mode === "clinical" && active.diagnosis) {
    const redFlags = active.diagnosis.redFlags.map((flag) => typeof flag === "string" ? flag : `${flag.flag} — ${flag.whyItMatters}`);
    return (
      <AppShell onBack={closeDetail} title={active.title} subtitle="Saved clinical case">
        <div className="mx-auto max-w-4xl space-y-4">
          <Notice title="AI-generated learning summary">Review this saved output against current guidance and the facts entered in the case.</Notice>
          <Surface className="p-5 sm:p-6">
            <p className="section-label">Suggested leading diagnosis</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-foreground">{active.diagnosis.primaryDiagnosis}</h1>
            <p className="mt-3 text-sm leading-7 text-muted">{active.diagnosis.clinicalReasoningSummary}</p>
          </Surface>
          {redFlags.length ? (
            <Surface className="p-5 sm:p-6"><h2 className="text-base font-semibold text-foreground">Red flags to review</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-muted">{redFlags.map((flag) => <li key={flag} className="border-l-2 border-danger/35 pl-3">{flag}</li>)}</ul></Surface>
          ) : null}
          <ButtonLink href="/clinical" variant="primary">Start another clinical case</ButtonLink>
        </div>
      </AppShell>
    );
  }

  if (active?.presentation) {
    return (
      <AppShell onBack={closeDetail} title={active.title} subtitle="Saved case presentation">
        <Surface className="mx-auto max-w-4xl p-5 sm:p-6">
          <p className="section-label">One-line summary</p>
          <p className="mt-3 text-base font-semibold text-foreground">{active.presentation.oneLiner}</p>
          <h2 className="mt-6 text-sm font-semibold text-foreground">Full presentation</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted">{active.presentation.fullPresentation}</p>
          <ButtonLink href="/classic" variant="primary" className="mt-6">Start another presentation</ButtonLink>
        </Surface>
      </AppShell>
    );
  }

  const removeItem = (id: string) => {
    removeFromLibrary(id);
    setVersion((current) => current + 1);
  };
  const clearItems = () => {
    if (!items.length || !window.confirm(`Remove ${items.length} saved item${items.length === 1 ? "" : "s"} from this device?`)) return;
    clearLibrary();
    setVersion((current) => current + 1);
  };

  return (
    <AppShell title="Case library" subtitle="Saved on this device">
      <div className="space-y-7">
        <PageHeader eyebrow="Workspace" title="Case library" description="Search and reopen clinical cases, presentations, and teaching sessions stored in this browser or app installation." actions={items.length ? <Button type="button" variant="danger" onClick={clearItems}><Trash2 aria-hidden="true" className="h-4 w-4" /> Clear library</Button> : undefined} />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search saved cases</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, complaints, subjects, or tags" className="min-h-11 w-full rounded-[10px] border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15" />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter saved cases">
            {(["all", "clinical", "classic", "teaching"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setFilter(mode)} aria-pressed={filter === mode} className={cn("min-h-11 rounded-[9px] border px-3 text-sm font-semibold", filter === mode ? "border-accent bg-brand-soft text-brand-strong" : "border-border bg-surface text-muted hover:bg-surface-subtle")}>{mode === "all" ? "All" : MODE_LABELS[mode]}</button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState title={query || filter !== "all" ? "No matching saved items" : "Your library is empty"} description={query || filter !== "all" ? "Try a broader search or another case type." : "Complete a clinical case, presentation, or teaching session and save it to return later."} action={<ButtonLink href="/dashboard" variant="primary">Choose a practice module</ButtonLink>} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="flex min-h-48 flex-col rounded-[14px] border border-border bg-surface p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="info">{MODE_LABELS[item.mode]}</Badge>
                  <button type="button" onClick={() => removeItem(item.id)} className="icon-button" aria-label={`Remove ${item.title}`}><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                </div>
                <Link href={`/library?id=${item.id}`} className="group mt-4 flex flex-1 flex-col rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <h2 className="text-base font-semibold text-foreground group-hover:text-brand-strong">{item.title}</h2>
                  {item.subject ? <p className="mt-1 text-xs font-semibold text-muted">{item.subject}</p> : null}
                  {item.tags.length ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted">{item.tags.slice(0, 4).join(" · ")}</p> : null}
                  <span className="mt-auto flex items-center justify-between pt-4 text-xs text-muted"><span>{new Date(item.savedAt).toLocaleDateString()}</span><span className="inline-flex items-center gap-1 font-semibold text-brand-strong"><FolderOpen aria-hidden="true" className="h-4 w-4" /> Open</span></span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function LibraryPage() {
  return <Suspense fallback={<AppShell title="Case library"><div className="h-64 animate-pulse rounded-[14px] border border-border bg-surface" /></AppShell>}><LibraryContent /></Suspense>;
}
