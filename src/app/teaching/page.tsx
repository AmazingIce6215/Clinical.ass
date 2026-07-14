"use client";

import { ArrowRight, BarChart3, BookOpenCheck, Bookmark } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { TeachingSubjectIcon } from "@/components/teaching/subject-icon";
import { Badge, Notice, PageHeader, Surface } from "@/components/ui/primitives";
import { searchLibrary } from "@/lib/case-library";
import { teachingSubjects } from "@/lib/teaching-subjects";
import { getSubjectStatsMap, getUserStats } from "@/lib/teaching-stats";

const teachingStoragePrefixes = [
  "clincalass-library",
  "clincalass-teaching-stats",
];

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getTeachingStorageSnapshot() {
  try {
    const entries: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && teachingStoragePrefixes.some((prefix) => key.startsWith(prefix))) {
        entries.push(`${key}:${window.localStorage.getItem(key) ?? ""}`);
      }
    }
    return entries.sort().join("|");
  } catch {
    return "";
  }
}

function getServerStorageSnapshot() {
  return "";
}

export default function TeachingPage() {
  const storageSnapshot = useSyncExternalStore(
    subscribeToStorage,
    getTeachingStorageSnapshot,
    getServerStorageSnapshot,
  );

  const { saved, subjectStatsMap, totalAttempted } = useMemo(() => {
    void storageSnapshot;
    const nextSaved = searchLibrary("", "teaching");
    const nextSubjectStats = getSubjectStatsMap();
    const stats = getUserStats();
    const attempted = Object.values(stats.subjectStats).reduce(
      (total, subject) => total + subject.attempted,
      0,
    );

    return {
      saved: nextSaved,
      subjectStatsMap: nextSubjectStats,
      totalAttempted: attempted,
    };
  }, [storageSnapshot]);

  return (
    <AppShell
      backHref="/dashboard"
      title="Teaching bank"
      subtitle="Generated case questions with formative explanations"
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <PageHeader
          eyebrow="Case-based practice"
          title="Teaching bank"
          description="Choose a clinical subject, set the level, and work through a short question set with an explanation for every option."
          actions={
            totalAttempted > 0 ? (
              <Link
                href="/stats"
                className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/35 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <BarChart3 aria-hidden="true" className="h-4 w-4" />
                View progress
              </Link>
            ) : null
          }
        />

        <Notice title="Generated educational content" tone="info">
          Cases, answer options, and explanations are generated for practice. They may be incomplete
          or incorrect and should be checked against current clinical guidance.
        </Notice>

        <section aria-labelledby="teaching-summary-heading">
          <h2 id="teaching-summary-heading" className="sr-only">
            Learning summary
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Surface className="flex items-center gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                <BookOpenCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-sm text-muted">Questions answered</dt>
                <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
                  {totalAttempted}
                </dd>
              </div>
            </Surface>
            <Surface className="flex items-center gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                <Bookmark aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-sm text-muted">Saved teaching cases</dt>
                <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
                  {saved.length}
                </dd>
              </div>
            </Surface>
          </dl>
        </section>

        {saved.length > 0 ? (
          <section className="space-y-4" aria-labelledby="saved-teaching-heading">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="section-label">Saved on this device</p>
                <h2 id="saved-teaching-heading" className="mt-1 text-xl font-semibold text-foreground">
                  Continue a saved case
                </h2>
              </div>
              <Link
                href="/library?mode=teaching"
                className="inline-flex min-h-11 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                View library
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {saved.slice(0, 3).map((savedCase) => (
                <Link
                  key={savedCase.id}
                  href={`/library?id=${savedCase.id}`}
                  className="group block rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Surface className="h-full p-4 transition-colors group-hover:border-accent/35 group-hover:bg-surface-subtle">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      {savedCase.subject ?? "Teaching case"}
                    </p>
                    <h3 className="mt-2 font-semibold text-foreground">{savedCase.title}</h3>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                      Open case
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </Surface>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4" aria-labelledby="teaching-subjects-heading">
          <div className="border-b border-border pb-3">
            <p className="section-label">Subjects</p>
            <h2 id="teaching-subjects-heading" className="mt-1 text-2xl font-semibold text-foreground">
              Choose a subject
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Each session contains three generated patient questions at your selected difficulty.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teachingSubjects.map((subject) => {
              const stats = subjectStatsMap[subject.id];
              const hasPracticeData = stats.attempted > 0;
              const accuracyTone =
                stats.accuracy >= 70
                  ? "success"
                  : stats.accuracy >= 40
                    ? "warning"
                    : "danger";

              return (
                <Link
                  key={subject.id}
                  href={`/teaching/${subject.id}`}
                  className="group block h-full rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Surface className="flex h-full flex-col p-5 transition-colors group-hover:border-accent/35 group-hover:bg-surface-subtle">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                        <TeachingSubjectIcon name={subject.icon} className="h-5 w-5" />
                      </span>
                      {hasPracticeData ? (
                        <Badge tone={accuracyTone}>{stats.accuracy}% correct</Badge>
                      ) : (
                        <Badge>Not started</Badge>
                      )}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">{subject.name}</h3>
                    <p className="mt-1 flex-1 text-sm leading-6 text-muted">{subject.description}</p>
                    {hasPracticeData ? (
                      <p className="mt-3 text-xs text-muted">
                        {stats.correct} of {stats.attempted} answered correctly
                      </p>
                    ) : null}
                    <span className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent">
                      Set up session
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </Surface>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
