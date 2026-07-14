"use client";

import Link from "next/link";
import {
  CalendarDays,
  Check,
  Clock3,
  Flame,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { TeachingSubjectIcon } from "@/components/teaching/subject-icon";
import {
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  Surface,
} from "@/components/ui/primitives";
import {
  getActivityHeatmapData,
  getOverallStats,
  getRecentAttempts,
  getStreak,
  getSubjectBreakdown,
  getWeakTopics,
} from "@/lib/teaching-stats";
import { teachingSubjects } from "@/lib/teaching-subjects";
import { cn } from "@/lib/utils";

const subscribe = () => () => undefined;

function useHasMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StatsPage() {
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <AppShell backHref="/dashboard" title="Progress" subtitle="Teaching activity and formative performance">
        <div className="space-y-5" aria-busy="true">
          <div className="h-28 animate-pulse rounded-[14px] border border-border bg-surface" />
          <div className="h-72 animate-pulse rounded-[14px] border border-border bg-surface" />
        </div>
      </AppShell>
    );
  }

  const overall = getOverallStats();
  const subjects = getSubjectBreakdown();
  const weakTopics = getWeakTopics();
  const streak = getStreak();
  const recent = getRecentAttempts(8);
  const activity = getActivityHeatmapData();
  const subjectMap = new Map(teachingSubjects.map((subject) => [subject.id, subject]));

  return (
    <AppShell backHref="/dashboard" title="Progress" subtitle="Teaching activity and formative performance">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Progress"
          title="Learning record"
          description="Review activity stored on this device. Percentages describe practice-question performance and are not clinical competency assessments."
          actions={<ButtonLink href="/teaching" variant="primary">Start teaching session</ButtonLink>}
        />

        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="sr-only">Performance summary</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Questions attempted" value={String(overall.totalAttempted)} icon={Target} />
            <Metric label="Practice accuracy" value={`${overall.overallAccuracy}%`} icon={Check} />
            <Metric label="Study time" value={formatTime(overall.totalStudyTime)} icon={Clock3} />
            <Metric label="Current activity streak" value={`${streak.current} day${streak.current === 1 ? "" : "s"}`} icon={Flame} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
          <div className="space-y-6">
            <Surface className="overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Subject performance</h2>
                <p className="mt-1 text-sm text-muted">Results from completed Teaching questions.</p>
              </div>
              {subjects.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="No teaching activity yet"
                    description="Complete a teaching question to begin building a subject-level record."
                    action={<ButtonLink href="/teaching" variant="primary">Choose a subject</ButtonLink>}
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {subjects.map((subject) => {
                    const strongest = subject.id === overall.strongest && subjects.length > 1;
                    const focus = subject.id === overall.weakest && subjects.length > 1;

                    return (
                      <Link
                        key={subject.id}
                        href={`/stats/${subject.id}`}
                        className="group block px-5 py-4 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-brand-strong">
                            <TeachingSubjectIcon name={subject.icon} className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-foreground">{subject.name}</h3>
                                {strongest ? <Badge tone="success">Highest accuracy</Badge> : null}
                                {focus ? <Badge tone="warning">Review suggested</Badge> : null}
                              </div>
                              <span className="text-sm font-semibold tabular-nums text-foreground">{subject.accuracy}%</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  subject.accuracy >= 80 ? "bg-success" : subject.accuracy >= 60 ? "bg-warning" : "bg-danger",
                                )}
                                style={{ width: `${subject.accuracy}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-muted">
                              {subject.correct} correct of {subject.attempted} attempted
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Surface>

            <Surface className="overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Recent activity</h2>
                <p className="mt-1 text-sm text-muted">Your latest answered teaching questions.</p>
              </div>
              {recent.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted">No answered questions are stored on this device.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((attempt, index) => {
                    const subject = subjectMap.get(attempt.subject);
                    return (
                      <li key={`${attempt.questionId}-${attempt.timestamp}-${index}`} className="flex items-center gap-3 px-5 py-3.5">
                        <span className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                          attempt.correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                        )}>
                          {attempt.correct ? <Check aria-label="Correct" className="h-4 w-4" /> : <X aria-label="Incorrect" className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{subject?.name ?? attempt.subject}</p>
                          <p className="mt-0.5 text-xs text-muted">{formatDate(attempt.timestamp)} · {attempt.difficulty}</p>
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-muted">
                          {attempt.timeTaken < 60 ? `${attempt.timeTaken}s` : `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Surface>
          </div>

          <aside className="space-y-6" aria-label="Activity details">
            <Surface className="p-5">
              <div className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="h-5 w-5 text-brand-strong" />
                <h2 className="text-base font-semibold text-foreground">Study activity</h2>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[10px] bg-surface-subtle p-3">
                  <dt className="text-xs text-muted">Longest streak</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">{streak.longest} days</dd>
                </div>
                <div className="rounded-[10px] bg-surface-subtle p-3">
                  <dt className="text-xs text-muted">Last active</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {streak.lastActiveDate
                      ? new Date(`${streak.lastActiveDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "No activity"}
                  </dd>
                </div>
              </dl>
              <ActivityGrid data={activity} />
            </Surface>

            <Surface className="p-5">
              <h2 className="text-base font-semibold text-foreground">Topics to revisit</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Based only on repeated answers in Teaching mode.</p>
              {weakTopics.length === 0 ? (
                <p className="mt-5 rounded-[10px] bg-surface-subtle p-4 text-sm text-muted">No repeated incorrect topics have been identified.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {weakTopics.slice(0, 6).map((topic, index) => (
                    <li key={topic.topic} className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-subtle text-xs font-semibold text-muted">{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium capitalize text-foreground">{topic.topic}</p>
                        <p className="mt-0.5 text-xs text-muted">{topic.incorrectCount} incorrect · {topic.accuracy}% practice accuracy</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Surface>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Surface className="p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <Icon aria-hidden="true" className="h-4 w-4 text-brand-strong" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-foreground">{value}</p>
    </Surface>
  );
}

function ActivityGrid({ data }: { data: Array<{ date: string; count: number; level: number }> }) {
  const recent = data.slice(-84);
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">Last 12 weeks</p>
        <p className="text-[11px] text-muted">Darker cells indicate more questions</p>
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-hidden" role="img" aria-label="Teaching-question activity over the last 12 weeks">
        {recent.map((day) => (
          <span
            key={day.date}
            title={`${day.date}: ${day.count} question${day.count === 1 ? "" : "s"}`}
            className={cn(
              "aspect-square min-w-0 rounded-[3px]",
              day.level === 0 && "bg-border",
              day.level === 1 && "bg-accent/20",
              day.level === 2 && "bg-accent/40",
              day.level === 3 && "bg-accent/65",
              day.level === 4 && "bg-accent",
            )}
          />
        ))}
      </div>
    </div>
  );
}
