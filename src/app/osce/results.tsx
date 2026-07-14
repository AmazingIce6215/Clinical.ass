"use client";

import {
  Check,
  CircleAlert,
  ClipboardCheck,
  MessageSquareText,
  ShieldAlert,
} from "lucide-react";
import { Badge, Button, ButtonLink, Notice, Surface } from "@/components/ui/primitives";
import type { OsceGradeResult } from "@/lib/osce/state";

const scoreSections: Array<{
  key: keyof OsceGradeResult["breakdown"];
  label: string;
  maximum: number;
}> = [
  { key: "history", label: "History taking", maximum: 40 },
  { key: "differential", label: "Differential diagnosis", maximum: 20 },
  { key: "investigations", label: "Investigations", maximum: 20 },
  { key: "management", label: "Management", maximum: 20 },
];

export function OsceResults({
  grade,
  onReset,
}: {
  grade: OsceGradeResult;
  onReset: () => void;
}) {
  const benchmarkLabel =
    grade.score >= 70
      ? "Practice benchmark met"
      : grade.score >= 50
        ? "Approaching practice benchmark"
        : "Further review recommended";
  const benchmarkTone = grade.score >= 70 ? "success" : grade.score >= 50 ? "warning" : "danger";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Surface className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">AI-generated formative feedback</Badge>
              <Badge tone={benchmarkTone}>{benchmarkLabel}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              Station feedback
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Review the automated score against the generated station criteria. This is a practice
              aid, not a validated examination result.
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Overall score</p>
            <p className="mt-1 text-5xl font-semibold tabular-nums text-foreground">{grade.score}%</p>
          </div>
        </div>
      </Surface>

      <section aria-labelledby="score-breakdown-heading">
        <div className="mb-3 border-b border-border pb-3">
          <h2 id="score-breakdown-heading" className="text-xl font-semibold text-foreground">
            Score breakdown
          </h2>
          <p className="mt-1 text-sm text-muted">Points awarded by the generated assessment criteria.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {scoreSections.map((section) => {
            const value = grade.breakdown[section.key];
            const percentage = Math.min(100, (value / section.maximum) * 100);
            return (
              <Surface key={section.key} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {value}
                    <span className="text-xs font-normal text-muted"> / {section.maximum}</span>
                  </p>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle"
                  role="progressbar"
                  aria-label={`${section.label} score`}
                  aria-valuemin={0}
                  aria-valuemax={section.maximum}
                  aria-valuenow={value}
                >
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
                </div>
              </Surface>
            );
          })}
        </div>
      </section>

      {grade.clinicalReasoning ? (
        <Surface className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <MessageSquareText aria-hidden="true" className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Clinical reasoning review</h2>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">
            {grade.clinicalReasoning}
          </p>
        </Surface>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {grade.critical_mistakes.length > 0 ? (
          <Surface className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-danger">
              <CircleAlert aria-hidden="true" className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Important omissions</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Items identified by the generated station criteria for focused review.
            </p>
            <ul className="mt-4 space-y-3">
              {grade.critical_mistakes.map((mistake, index) => (
                <li key={`${mistake}-${index}`} className="flex gap-2 text-sm leading-6 text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}

        {grade.missed_red_flags.length > 0 ? (
          <Surface className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-warning">
              <ShieldAlert aria-hidden="true" className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Safety topics to revisit</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Potential red-flag topics not covered in the interview transcript.
            </p>
            <ul className="mt-4 space-y-3">
              {grade.missed_red_flags.map((flag, index) => (
                <li key={`${flag}-${index}`} className="flex gap-2 text-sm leading-6 text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}
      </div>

      {grade.examiner_feedback.length > 0 ? (
        <Surface className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ClipboardCheck aria-hidden="true" className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Formative feedback summary</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {grade.examiner_feedback.map((feedback, index) => (
              <li key={`${feedback}-${index}`} className="flex gap-2 text-sm leading-6 text-muted">
                <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <span>{feedback}</span>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      <Surface className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Suggested response outline</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          A generated comparison outline for review, not a definitive model answer.
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <OutlineSection label="Key history questions" items={grade.model_answer.history} />
          <OutlineSection label="Differential diagnoses" items={grade.model_answer.differential} />
          <OutlineSection label="Investigations" items={grade.model_answer.investigations} />
          <OutlineSection label="Management considerations" items={grade.model_answer.management} />
        </div>
      </Surface>

      <Notice title="Use feedback formatively" tone="info">
        Discuss uncertain or high-risk points with a qualified supervisor and check current local
        guidance before applying anything in clinical care.
      </Notice>

      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <Button onClick={onReset}>Start another station</Button>
        <ButtonLink href="/osce/stats" variant="secondary">
          View practice history
        </ButtonLink>
        <ButtonLink href="/dashboard" variant="ghost">
          Return to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}

function OutlineSection({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-6 text-muted">
            <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-success" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
