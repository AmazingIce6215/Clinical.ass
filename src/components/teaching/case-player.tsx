"use client";

import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  CircleX,
  Lightbulb,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, ButtonLink, Notice, Surface } from "@/components/ui/primitives";
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

function subscribeToLibrary(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getServerFavoriteSnapshot() {
  return false;
}

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
  const [favoriteRevision, setFavoriteRevision] = useState(0);
  const questionStartTimeRef = useRef(0);

  const getFavoriteSnapshot = useCallback(() => {
    void favoriteRevision;
    return isInLibrary(teachingCase.id);
  }, [favoriteRevision, teachingCase.id]);
  const favorited = useSyncExternalStore(
    subscribeToLibrary,
    getFavoriteSnapshot,
    getServerFavoriteSnapshot,
  );

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

    if (correct) setScore((currentScore) => currentScore + 1);

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
        teachingCase.questions.map((item) => item.vignette),
      );
      setFinished(true);
      return;
    }

    setQuestionIndex((currentIndex) => currentIndex + 1);
    setSelected(null);
    setRevealed(false);
  };

  const toggleFavorite = useCallback(() => {
    if (favorited) {
      removeFromLibrary(teachingCase.id);
    } else {
      saveTeachingToLibrary({ ...teachingCase, favorited: true });
    }
    setFavoriteRevision((revision) => revision + 1);
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
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <h1 className="sr-only">{teachingCase.title}</h1>

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-subtle"
              role="progressbar"
              aria-label="Teaching session progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>
                Question {Math.min(questionIndex + 1, teachingCase.questions.length)} of{" "}
                {teachingCase.questions.length}
              </span>
              <span aria-hidden="true">·</span>
              <Badge tone="info">AI-generated case</Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFavorite}
            className={cn(
              "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[10px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              favorited
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border bg-surface text-muted hover:border-accent/35 hover:text-foreground",
            )}
            aria-label={favorited ? "Remove case from library" : "Save case to library"}
            aria-pressed={favorited}
          >
            {favorited ? (
              <BookmarkCheck aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Bookmark aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>

        {!finished ? (
          <>
            <Surface className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Patient information</Badge>
                {question.patientLabel ? <Badge tone="neutral">{question.patientLabel}</Badge> : null}
              </div>
              <h2 className="mt-4 text-sm font-semibold text-foreground">Case vignette</h2>
              <p className="mt-2 text-sm leading-7 text-foreground">{question.vignette}</p>
            </Surface>

            <Surface className="p-5 sm:p-6">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submit();
                }}
              >
                <fieldset>
                  <legend className="text-lg font-semibold leading-7 text-foreground">
                    {question.prompt}
                  </legend>
                  <p className="mt-1 text-xs text-muted">Select the single best answer.</p>

                  <div className="mt-5 space-y-2.5">
                    {question.options.map((option, index) => {
                      const isSelected = selected === index;
                      const isCorrect = index === question.correctIndex;
                      let stateClass = "border-border bg-surface hover:border-accent/35";

                      if (revealed) {
                        if (isCorrect) {
                          stateClass = "border-success/35 bg-success-soft";
                        } else if (isSelected) {
                          stateClass = "border-danger/35 bg-danger-soft";
                        } else {
                          stateClass = "border-border bg-surface-subtle text-muted";
                        }
                      } else if (isSelected) {
                        stateClass = "border-accent bg-accent/10";
                      }

                      return (
                        <label
                          key={`${question.id}-${index}`}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border p-3.5 text-left text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                            revealed && "cursor-default",
                            stateClass,
                          )}
                        >
                          <input
                            type="radio"
                            name={`answer-${question.id}`}
                            value={index}
                            checked={isSelected}
                            disabled={revealed}
                            onChange={() => setSelected(index)}
                            className="sr-only"
                          />
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                              revealed && isCorrect
                                ? "border-success/30 bg-success-soft text-success"
                                : revealed && isSelected
                                  ? "border-danger/30 bg-danger-soft text-danger"
                                  : isSelected
                                    ? "border-accent bg-accent text-accent-foreground"
                                    : "border-border bg-surface-subtle text-muted",
                            )}
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="pt-0.5 leading-6">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {revealed ? (
                  <section
                    className="mt-6 space-y-4 border-t border-border pt-5"
                    aria-labelledby={`feedback-${question.id}`}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">Formative feedback</Badge>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-sm font-semibold",
                          selected === question.correctIndex ? "text-success" : "text-danger",
                        )}
                      >
                        {selected === question.correctIndex ? (
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <CircleX aria-hidden="true" className="h-4 w-4" />
                        )}
                        {selected === question.correctIndex ? "Correct" : "Not the best answer"}
                      </span>
                    </div>

                    <div>
                      <h2 id={`feedback-${question.id}`} className="text-base font-semibold text-foreground">
                        Answer explanation
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted">{question.explanation}</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Option review</h3>
                      {question.options.map((option, index) => (
                        <div
                          key={`${question.id}-explanation-${index}`}
                          className={cn(
                            "rounded-[10px] border p-3 text-sm",
                            index === question.correctIndex
                              ? "border-success/25 bg-success-soft"
                              : "border-border bg-surface-subtle",
                          )}
                        >
                          <p className="font-medium text-foreground">
                            {String.fromCharCode(65 + index)}. {option}
                          </p>
                          <p className="mt-1 leading-6 text-muted">
                            {question.optionExplanations[index] ??
                              (index === question.correctIndex
                                ? question.explanation
                                : "This option is less consistent with the case information provided.")}
                          </p>
                        </div>
                      ))}
                    </div>

                    <Notice title="Teaching point" tone="info">
                      <span className="flex gap-2">
                        <Lightbulb aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{question.teachingPearl}</span>
                      </span>
                    </Notice>
                  </section>
                ) : null}

                <div className="mt-6 flex justify-end">
                  {!revealed ? (
                    <Button type="submit" disabled={selected === null}>
                      Submit answer
                    </Button>
                  ) : (
                    <Button type="button" onClick={next}>
                      {questionIndex + 1 >= teachingCase.questions.length
                        ? "Review session"
                        : "Next question"}
                    </Button>
                  )}
                </div>
              </form>
            </Surface>
          </>
        ) : (
          <Surface className="p-6 sm:p-8">
            <Badge tone="info">Session summary</Badge>
            <h2 className="mt-4 text-2xl font-semibold text-foreground">Teaching session complete</h2>
            <p className="mt-4 text-4xl font-semibold tabular-nums text-foreground">
              {score} of {teachingCase.questions.length}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              This score reflects this generated question set only. Review the explanations before
              starting another session or retrying the same questions.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {showNewCase && onNewCase ? (
                <Button onClick={onNewCase}>New session</Button>
              ) : null}
              <Button variant="secondary" onClick={reset}>
                Retry this session
              </Button>
              <ButtonLink href={backHref ?? "/teaching"} variant="ghost">
                Back to subjects
              </ButtonLink>
            </div>
          </Surface>
        )}
      </div>
    </AppShell>
  );
}
