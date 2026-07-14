"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { use, useCallback, useEffect, useRef, useState } from "react";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  FileSearch,
  ListChecks,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TeachingSubjectIcon } from "@/components/teaching/subject-icon";
import {
  Badge,
  Button,
  ButtonLink,
  Notice,
  PageHeader,
  Surface,
} from "@/components/ui/primitives";
import {
  getSubjectAiInsight,
  getSubjectAttemptsForAnalysis,
  getSubjectBreakdown,
  getWeakTopics,
  needsAnalysis,
  setSubjectAiInsight,
} from "@/lib/teaching-stats";
import { getSubject } from "@/lib/teaching-subjects";
import type { SubjectAiInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SubjectStatsPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: subjectId } = use(params);
  const subjectInfo = getSubject(subjectId);
  const [insight, setInsight] = useState<SubjectAiInsight | null>(() =>
    !needsAnalysis(subjectId) ? getSubjectAiInsight(subjectId) : null,
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const subjectStats = getSubjectBreakdown().find((subject) => subject.id === subjectId);
  const weakTopics = getWeakTopics().filter((topic) =>
    subjectId === "all" || topic.topic.toLowerCase().includes(subjectId),
  );

  const runAnalysis = useCallback(async () => {
    if (!subjectInfo || !subjectStats) return;
    setAnalyzing(true);
    setError(null);

    try {
      const attempts = getSubjectAttemptsForAnalysis(subjectId);
      if (attempts.length === 0) {
        setError("More completed questions are needed before a generated review can be prepared.");
        return;
      }

      const response = await fetch("/api/teaching/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectId,
          subjectName: subjectInfo.name,
          attempts: attempts.map((attempt) => ({
            vignette: attempt.vignette,
            prompt: attempt.prompt,
            options: attempt.options,
            correctAnswerText: attempt.correctAnswerText,
            userAnswerText: attempt.userAnswerText,
            correct: attempt.correct,
            timeTaken: attempt.timeTaken,
            difficulty: attempt.difficulty,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "The generated review is temporarily unavailable.");
        return;
      }

      const data = await response.json();
      setSubjectAiInsight(subjectId, data.insight);
      setInsight(data.insight);
    } catch {
      setError("The generated review could not be reached. Check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  }, [subjectId, subjectInfo, subjectStats]);

  useEffect(() => {
    if (initialized.current || !subjectInfo || !subjectStats) return;
    initialized.current = true;
    if (!insight && !error) void runAnalysis();
  }, [error, insight, runAnalysis, subjectInfo, subjectStats]);

  if (!subjectInfo) notFound();

  return (
    <AppShell backHref="/stats" title={subjectInfo.name} subtitle="Subject-level formative performance">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="Progress"
          title={subjectInfo.name}
          description={subjectInfo.description}
          actions={<ButtonLink href={`/teaching/${subjectInfo.id}`} variant="primary">Practice this subject</ButtonLink>}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.45fr)]">
          <div className="space-y-6">
            <Surface className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-brand-soft text-brand-strong">
                  <TeachingSubjectIcon name={subjectInfo.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Practice summary</h2>
                  <p className="text-sm text-muted">Teaching mode only</p>
                </div>
              </div>

              {subjectStats ? (
                <>
                  <dl className="mt-5 grid grid-cols-3 gap-2">
                    <Metric label="Accuracy" value={`${subjectStats.accuracy}%`} />
                    <Metric label="Attempted" value={String(subjectStats.attempted)} />
                    <Metric label="Correct" value={String(subjectStats.correct)} />
                  </dl>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border" aria-label={`${subjectStats.accuracy}% practice accuracy`}>
                    <div
                      className={cn(
                        "h-full rounded-full",
                        subjectStats.accuracy >= 80 ? "bg-success" : subjectStats.accuracy >= 60 ? "bg-warning" : "bg-danger",
                      )}
                      style={{ width: `${subjectStats.accuracy}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="mt-5 rounded-[10px] bg-surface-subtle p-4 text-sm leading-6 text-muted">
                  No completed questions are stored for this subject.
                </p>
              )}
            </Surface>

            <Surface className="p-5">
              <h2 className="text-base font-semibold text-foreground">Topics to revisit</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Derived from your answered questions, not from a competency assessment.</p>
              {weakTopics.length > 0 ? (
                <ol className="mt-4 space-y-3">
                  {weakTopics.map((topic, index) => (
                    <li key={topic.topic} className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-subtle text-xs font-semibold text-muted">{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium capitalize text-foreground">{topic.topic}</p>
                        <p className="mt-0.5 text-xs text-muted">{topic.incorrectCount} incorrect · {topic.accuracy}% practice accuracy</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 text-sm text-muted">No repeated incorrect topics have been identified.</p>
              )}
            </Surface>
          </div>

          <Surface className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-info-soft text-info">
                  <FileSearch aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">Generated study review</h2>
                    <Badge tone="info">AI-generated</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted">A formative summary of recent answers. Verify suggestions against trusted learning resources.</p>
                </div>
              </div>
              {insight && !analyzing ? (
                <Button variant="secondary" onClick={runAnalysis}>
                  <RefreshCw aria-hidden="true" className="h-4 w-4" /> Refresh
                </Button>
              ) : null}
            </div>

            {analyzing ? (
              <div className="flex min-h-56 items-center justify-center" role="status" aria-live="polite">
                <div className="text-center">
                  <LoaderCircle aria-hidden="true" className="mx-auto h-7 w-7 animate-spin text-brand-strong" />
                  <p className="mt-3 text-sm font-medium text-foreground">Preparing a study review</p>
                  <p className="mt-1 text-xs text-muted">Recent answers are being processed by the configured AI provider.</p>
                </div>
              </div>
            ) : null}

            {error && !analyzing ? (
              <div className="mt-5 space-y-4">
                <Notice title="Review unavailable" tone="warning">{error}</Notice>
                <Button variant="secondary" onClick={runAnalysis}>Try again</Button>
              </div>
            ) : null}

            {insight && !analyzing ? <InsightSections insight={insight} /> : null}

            {!subjectStats && !analyzing ? (
              <div className="mt-5 rounded-[12px] border border-border bg-surface-subtle p-5">
                <ListChecks aria-hidden="true" className="h-5 w-5 text-brand-strong" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">Complete a few questions first</h3>
                <p className="mt-1 text-sm leading-6 text-muted">A generated review needs completed Teaching answers from this subject.</p>
              </div>
            ) : null}
          </Surface>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-surface-subtle p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function InsightSections({ insight }: { insight: SubjectAiInsight }) {
  return (
    <div className="mt-5 space-y-6">
      {insight.strengths.length > 0 ? (
        <section aria-labelledby="strengths-heading">
          <h3 id="strengths-heading" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-success" /> Observed strengths
          </h3>
          <div className="mt-3 space-y-2">
            {insight.strengths.map((strength) => (
              <div key={`${strength.area}-${strength.detail}`} className="rounded-[10px] border border-border p-4">
                <p className="text-sm font-medium text-foreground">{strength.area}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{strength.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {insight.weaknesses.length > 0 ? (
        <section aria-labelledby="improvement-heading">
          <h3 id="improvement-heading" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TriangleAlert aria-hidden="true" className="h-4 w-4 text-warning" /> Areas for review
          </h3>
          <div className="mt-3 space-y-2">
            {insight.weaknesses.map((weakness) => (
              <div key={`${weakness.area}-${weakness.detail}`} className="rounded-[10px] border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{weakness.area}</p>
                  <Badge tone={weakness.severity === "high" ? "danger" : weakness.severity === "medium" ? "warning" : "neutral"}>
                    {weakness.severity} priority
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">{weakness.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {insight.recommendations.length > 0 ? (
        <section aria-labelledby="recommendations-heading">
          <h3 id="recommendations-heading" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListChecks aria-hidden="true" className="h-4 w-4 text-info" /> Suggested study steps
          </h3>
          <ol className="mt-3 space-y-2">
            {insight.recommendations.map((recommendation, index) => (
              <li key={recommendation} className="flex gap-3 rounded-[10px] bg-surface-subtle p-3 text-sm leading-6 text-muted">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold text-foreground">{index + 1}</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <p className="border-t border-border pt-4 text-xs text-muted">
        Generated {new Date(insight.generatedAt).toLocaleDateString("en-US", { dateStyle: "medium" })} from {insight.attemptCount} recorded attempt{insight.attemptCount === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
