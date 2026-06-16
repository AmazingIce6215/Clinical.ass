"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppShell,
  ButtonLink,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
} from "@/components/app-shell";
import { FadeSlide, ProgressBar } from "@/components/motion";
import {
  isInLibrary,
  markDiseaseSeen,
  markTitleSeen,
  markVignettesSeen,
  removeFromLibrary,
  saveTeachingToLibrary,
} from "@/lib/case-library";
import { logAttempt } from "@/lib/teaching-stats";
import type { GeneratedTeachingCase } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CasePlayer({
  teachingCase,
  backHref,
  onBack,
  onNewCase,
  showNewCase = false,
}: {
  teachingCase: GeneratedTeachingCase;
  backHref?: string;
  onBack?: () => void;
  onNewCase?: () => void;
  showNewCase?: boolean;
}) {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [favorited, setFavorited] = useState(() => isInLibrary(teachingCase.id));

  const questionStartTimeRef = useRef(0);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [questionIndex]);

  const question = teachingCase.questions[questionIndex];
  const progress = finished
    ? 100
    : ((questionIndex + (revealed ? 1 : 0)) / teachingCase.questions.length) * 100;

  const handleBack = onBack ?? (() => router.push(backHref ?? "/teaching"));

  const submit = () => {
    if (selected === null) return;
    const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    const correct = selected === question.correctIndex;
    if (correct) {
      setScore((s) => s + 1);
    }
    logAttempt({
      questionId: question.id,
      subject: teachingCase.subject,
      difficulty: teachingCase.difficulty,
      userAnswer: selected,
      correctAnswer: question.correctIndex,
      correct,
      timeTaken,
      vignette: question.vignette,
      prompt: question.prompt,
      options: question.options,
      correctAnswerText: question.options[question.correctIndex],
      userAnswerText: question.options[selected],
    });
    setRevealed(true);
  };

  const next = () => {
    if (questionIndex + 1 >= teachingCase.questions.length) {
      markTitleSeen(teachingCase.subject, teachingCase.title);
      markDiseaseSeen(teachingCase.subject, teachingCase.title);
      markVignettesSeen(
        teachingCase.subject,
        teachingCase.questions.map((q) => q.vignette),
      );
      setFinished(true);
    } else {
      setQuestionIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const toggleFavorite = useCallback(() => {
    if (favorited) {
      removeFromLibrary(teachingCase.id);
      setFavorited(false);
    } else {
      saveTeachingToLibrary({ ...teachingCase, favorited: true });
      setFavorited(true);
    }
  }, [favorited, teachingCase]);

  const reset = () => {
    setQuestionIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
    questionStartTimeRef.current = Date.now();
  };

  return (
    <AppShell
      onBack={handleBack}
      title={teachingCase.title}
      subtitle={`${teachingCase.subjectName} · ${teachingCase.difficulty}`}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex-1">
            <ProgressBar value={progress} />
            <p className="mt-2 text-xs text-muted">
              Question {Math.min(questionIndex + 1, teachingCase.questions.length)} of{" "}
              {teachingCase.questions.length}
            </p>
          </div>
          <motion.button
            type="button"
            onClick={toggleFavorite}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg transition",
              favorited
                ? "border-amber-500/50 bg-amber-500/15"
                : "border-border/70 bg-surface/60 hover:border-amber-500/30",
            )}
            whileTap={{ scale: 0.92 }}
            aria-label={favorited ? "Remove from library" : "Save to library"}
          >
            {favorited ? "★" : "☆"}
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {!finished ? (
            <FadeSlide key={`q-${questionIndex}`}>
              <GlassCard className="mb-4">
                {question.patientLabel && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    {question.patientLabel}
                  </p>
                )}
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Case vignette
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                  {question.vignette}
                </p>
              </GlassCard>

              <GlassCard>
                <h2 className="text-lg font-semibold">{question.prompt}</h2>

                <div className="mt-5 space-y-2.5">
                  {question.options.map((opt, i) => {
                    const isSelected = selected === i;
                    const isCorrect = i === question.correctIndex;
                    let stateClass = "border-border/70 hover:border-accent/40";

                    if (revealed) {
                      if (isCorrect) stateClass = "border-emerald-500/60 bg-emerald-500/10";
                      else if (isSelected) stateClass = "border-red-500/60 bg-red-500/10";
                      else stateClass = "border-border/40 opacity-70";
                    } else if (isSelected) {
                      stateClass = "border-accent bg-accent/10";
                    }

                    return (
                      <motion.button
                        key={`${question.id}-${i}`}
                        type="button"
                        disabled={revealed}
                        onClick={() => setSelected(i)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition",
                          stateClass,
                        )}
                        whileHover={revealed ? undefined : { x: 4 }}
                        whileTap={revealed ? undefined : { scale: 0.995 }}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                            revealed && isCorrect
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : revealed && isSelected
                                ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                : "bg-surface",
                          )}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-5 space-y-3 overflow-hidden"
                    >
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">
                          Correct answer: {String.fromCharCode(65 + question.correctIndex)}
                        </p>
                        <p className="mt-2 text-muted">{question.explanation}</p>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-surface/40 p-4 text-sm">
                        <p className="mb-3 font-medium">All options explained</p>
                        <div className="space-y-3">
                          {question.options.map((opt, i) => (
                            <div
                              key={i}
                              className={cn(
                                "rounded-lg border p-3",
                                i === question.correctIndex
                                  ? "border-emerald-500/30 bg-emerald-500/5"
                                  : "border-border/40",
                              )}
                            >
                              <p className="font-medium">
                                {String.fromCharCode(65 + i)}. {opt}
                              </p>
                              <p className="mt-1 text-muted">
                                {question.optionExplanations[i] ??
                                  (i === question.correctIndex
                                    ? question.explanation
                                    : "This is not the best answer for this scenario.")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm">
                        <p className="font-medium text-accent">Teaching pearl</p>
                        <p className="mt-1 text-muted">{question.teachingPearl}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6 flex justify-end gap-3">
                  {!revealed ? (
                    <PrimaryButton onClick={submit} disabled={selected === null}>
                      Submit answer
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton onClick={next}>
                      {questionIndex + 1 >= teachingCase.questions.length
                        ? "See results"
                        : "Next question"}
                    </PrimaryButton>
                  )}
                </div>
              </GlassCard>
            </FadeSlide>
          ) : (
            <FadeSlide key="done">
              <GlassCard className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <p className="text-5xl font-bold text-accent">
                    {score}/{teachingCase.questions.length}
                  </p>
                  <p className="mt-2 text-lg font-medium">Session complete</p>
                  <p className="mt-1 text-sm text-muted">
                    {score === teachingCase.questions.length
                      ? "Perfect — excellent clinical reasoning!"
                      : "Review the explanations and try again."}
                  </p>
                </motion.div>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {showNewCase && onNewCase && (
                    <PrimaryButton onClick={onNewCase}>New session</PrimaryButton>
                  )}
                  <SecondaryButton onClick={reset}>Retry this session</SecondaryButton>
                  <ButtonLink href={backHref ?? "/teaching"}>Back</ButtonLink>
                </div>
              </GlassCard>
            </FadeSlide>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
