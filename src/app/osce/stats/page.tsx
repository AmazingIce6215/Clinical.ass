"use client";

import { BarChart3, CircleAlert, ClipboardCheck, Target } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import {
  Badge,
  ButtonLink,
  Notice,
  PageHeader,
  Surface,
} from "@/components/ui/primitives";
import {
  getOsceDifficultyStats,
  getOsceDomainBreakdown,
  getOsceOverallStats,
  getOsceRecentSessions,
  getOsceWeaknesses,
} from "@/lib/osce-stats";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function subscribeToOsceStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getOsceStorageSnapshot() {
  try {
    const entries: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("clincalass-osce-stats")) {
        entries.push(`${key}:${window.localStorage.getItem(key) ?? ""}`);
      }
    }
    return entries.sort().join("|");
  } catch {
    return "";
  }
}

function getServerOsceStorageSnapshot() {
  return "";
}

export default function OsceStatsPage() {
  const storageSnapshot = useSyncExternalStore(
    subscribeToOsceStorage,
    getOsceStorageSnapshot,
    getServerOsceStorageSnapshot,
  );
  const { overall, domains, weaknesses, difficultyStats, recent } = useMemo(() => {
    void storageSnapshot;
    return {
      overall: getOsceOverallStats(),
      domains: getOsceDomainBreakdown(),
      weaknesses: getOsceWeaknesses(),
      difficultyStats: getOsceDifficultyStats(),
      recent: getOsceRecentSessions(10),
    };
  }, [storageSnapshot]);

  const noData = overall.totalSessions === 0;

  return (
    <AppShell
      backHref="/osce"
      title="OSCE practice history"
      subtitle="Saved formative scores from this device"
    >
      <div className="mx-auto w-full max-w-6xl space-y-7">
        <PageHeader
          eyebrow="Progress"
          title="OSCE practice history"
          description="Review saved station scores and identify topics to revisit in supervised practice."
          actions={
            <ButtonLink href="/osce" variant="primary">
              <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
              Start a station
            </ButtonLink>
          }
        />

        <Notice title="Formative data only" tone="info">
          These scores come from generated stations and automated criteria. They are not validated
          exam results and should not be used to establish clinical competence.
        </Notice>

        {noData ? (
          <Surface className="px-6 py-10 text-center sm:py-12">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
              <BarChart3 aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-foreground">No OSCE practice saved yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Complete a station to create your first formative score record on this device.
            </p>
            <div className="mt-5 flex justify-center">
              <ButtonLink href="/osce" variant="primary">
                Start first station
              </ButtonLink>
            </div>
          </Surface>
        ) : (
          <>
            <section aria-labelledby="osce-overview-heading">
              <div className="mb-3 border-b border-border pb-3">
                <h2 id="osce-overview-heading" className="text-xl font-semibold text-foreground">
                  Overview
                </h2>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Average score" value={`${overall.averageScore}%`} />
                <Metric label="Practice benchmark met" value={`${overall.passRate}%`} />
                <Metric label="Stations completed" value={overall.totalSessions.toString()} />
                <Metric label="Highest saved score" value={`${overall.bestScore}%`} />
              </dl>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section aria-labelledby="difficulty-heading">
                <Surface className="h-full p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Target aria-hidden="true" className="h-5 w-5 text-accent" />
                    <h2 id="difficulty-heading" className="text-lg font-semibold text-foreground">
                      Scores by difficulty
                    </h2>
                  </div>
                  <div className="mt-5 divide-y divide-border">
                    {(["easy", "medium", "hard"] as const).map((difficulty) => {
                      const stat = difficultyStats[difficulty];
                      return (
                        <div key={difficulty} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                          <div>
                            <p className="text-sm font-semibold capitalize text-foreground">{difficulty}</p>
                            <p className="mt-0.5 text-xs text-muted">
                              {stat.sessions} station{stat.sessions === 1 ? "" : "s"}
                            </p>
                          </div>
                          <p className="text-lg font-semibold tabular-nums text-foreground">
                            {stat.sessions > 0 ? `${stat.averageScore}%` : "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Surface>
              </section>

              <section aria-labelledby="domain-heading">
                <Surface className="h-full p-5 sm:p-6">
                  <h2 id="domain-heading" className="text-lg font-semibold text-foreground">
                    Domain breakdown
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted">Average awarded points across saved stations.</p>
                  <div className="mt-5 space-y-4">
                    {domains.map((domain) => {
                      const percentage = domain.max > 0 ? (domain.average / domain.max) * 100 : 0;
                      return (
                        <div key={domain.key}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">{domain.label}</p>
                            <p className="text-sm tabular-nums text-muted">
                              {domain.average.toFixed(1)} / {domain.max}
                            </p>
                          </div>
                          <div
                            className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle"
                            role="progressbar"
                            aria-label={`${domain.label} average`}
                            aria-valuemin={0}
                            aria-valuemax={domain.max}
                            aria-valuenow={Number(domain.average.toFixed(1))}
                          >
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Surface>
              </section>
            </div>

            {weaknesses.length > 0 ? (
              <section aria-labelledby="review-areas-heading">
                <div className="mb-3 border-b border-border pb-3">
                  <h2 id="review-areas-heading" className="text-xl font-semibold text-foreground">
                    Topics to revisit
                  </h2>
                  <p className="mt-1 text-sm text-muted">Patterns calculated from saved practice records.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {weaknesses.map((weakness) => (
                    <Surface key={`${weakness.type}-${weakness.label}`} className="flex gap-3 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-warning-soft text-warning">
                        <CircleAlert aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{weakness.label}</h3>
                          <Badge tone={weakness.severity === "high" ? "danger" : "warning"}>
                            {weakness.severity === "high" ? "Priority review" : "Review"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted">{weakness.description}</p>
                      </div>
                    </Surface>
                  ))}
                </div>
              </section>
            ) : null}

            <section aria-labelledby="recent-osce-heading">
              <div className="mb-3 border-b border-border pb-3">
                <h2 id="recent-osce-heading" className="text-xl font-semibold text-foreground">
                  Recent stations
                </h2>
                <p className="mt-1 text-sm text-muted">The ten most recent records saved on this device.</p>
              </div>
              <Surface className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                    <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-[0.1em] text-muted">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Difficulty</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Score</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Practice benchmark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recent.map((record) => (
                        <tr key={record.id}>
                          <td className="px-4 py-3 text-foreground">{formatDate(record.timestamp)}</td>
                          <td className="px-4 py-3 capitalize text-muted">{record.difficulty}</td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                            {record.score}%
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge tone={record.passed ? "success" : "warning"}>
                              {record.passed ? "Met" : "Not met"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Surface>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Surface className="p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</dd>
    </Surface>
  );
}
