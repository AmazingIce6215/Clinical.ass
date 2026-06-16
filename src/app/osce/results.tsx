"use client";

import { motion } from "framer-motion";
import { GlassCard, PrimaryButton, ButtonLink } from "@/components/app-shell";
import type { OsceGradeResult } from "@/lib/osce/state";
import { cn } from "@/lib/utils";

export function OsceResults({
  grade,
  onReset,
}: {
  grade: OsceGradeResult;
  onReset: () => void;
}) {
  const scoreColor =
    grade.score >= 70 ? "text-emerald-500" : grade.score >= 50 ? "text-amber-500" : "text-red-500";

  const sections: { key: keyof typeof grade.breakdown; label: string; max: number }[] = [
    { key: "history", label: "History Taking", max: 40 },
    { key: "differential", label: "Differential Diagnosis", max: 20 },
    { key: "investigations", label: "Investigations", max: 20 },
    { key: "management", label: "Management", max: 20 },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          OSCE Result
        </p>
        <div className={cn("mt-4 text-6xl font-bold", scoreColor)}>
          {grade.score}%
        </div>
        <p className="mt-2 text-sm text-muted">
          {grade.score >= 70
            ? "Pass — Competent performance"
            : grade.score >= 50
              ? "Borderline — Requires improvement"
              : "Fail — Below expected standard"}
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <GlassCard key={section.key}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{section.label}</p>
              <span className="text-2xl font-bold text-accent">
                {grade.breakdown[section.key]}
                <span className="text-xs text-muted">/{section.max}</span>
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(grade.breakdown[section.key] / section.max) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-accent"
              />
            </div>
          </GlassCard>
        ))}
      </div>

      {grade.clinicalReasoning && (
        <GlassCard>
          <h3 className="mb-3 text-sm font-semibold text-accent">Clinical Reasoning Assessment</h3>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {grade.clinicalReasoning}
          </div>
        </GlassCard>
      )}

      {grade.critical_mistakes.length > 0 && (
        <GlassCard>
          <h3 className="mb-3 text-sm font-semibold text-red-500">Critical Mistakes</h3>
          <ul className="space-y-2">
            {grade.critical_mistakes.map((mistake, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-2 text-sm text-muted"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {mistake}
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      )}

      {grade.missed_red_flags.length > 0 && (
        <GlassCard>
          <h3 className="mb-3 text-sm font-semibold text-amber-500">Missed Red Flags</h3>
          <ul className="space-y-2">
            {grade.missed_red_flags.map((flag, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-2 text-sm text-muted"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {flag}
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      )}

      {grade.examiner_feedback.length > 0 && (
        <GlassCard>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Examiner Feedback</h3>
          <ul className="space-y-3">
            {grade.examiner_feedback.map((fb, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-2 text-sm leading-relaxed text-muted"
              >
                <span className="mt-0.5 text-accent">•</span>
                {fb}
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="mb-4 text-sm font-semibold text-accent">Model Answer</h3>
        <div className="space-y-4">
          <Section label="Key History Questions" items={grade.model_answer.history} />
          <Section label="Differential Diagnoses" items={grade.model_answer.differential} />
          <Section label="Investigations" items={grade.model_answer.investigations} />
          <Section label="Management Plan" items={grade.model_answer.management} />
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-3 pt-2">
        <PrimaryButton onClick={onReset}>New OSCE Station</PrimaryButton>
        <ButtonLink href="/">Home</ButtonLink>
      </div>
    </div>
  );
}

function Section({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <span className="mt-0.5 text-emerald-500">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
