"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  Volume2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { OsceResults } from "@/app/osce/results";
import { OsceSession } from "@/app/osce/session";
import {
  Badge,
  Button,
  ButtonLink,
  Notice,
  PageHeader,
  Surface,
} from "@/components/ui/primitives";
import { logOsceSession } from "@/lib/osce-stats";
import type {
  Difficulty,
  OsceCase,
  OsceGradeResult,
  OsceSessionState,
} from "@/lib/osce/state";
import { cn } from "@/lib/utils";

type View = "start" | "session" | "results";

const difficultyOptions: Array<{
  value: Difficulty;
  label: string;
  description: string;
}> = [
  {
    value: "easy",
    label: "Easy",
    description: "Common presentation with direct history cues.",
  },
  {
    value: "medium",
    label: "Medium",
    description: "More information to prioritise and interpret.",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Less typical presentation with closer alternatives.",
  },
];

export default function OscePage() {
  const [view, setView] = useState<View>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [session, setSession] = useState<OsceSessionState | null>(null);
  const [grade, setGrade] = useState<OsceGradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef(session);

  const handleStart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/osce/generate-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to generate case");
      }

      const caseData = (await response.json()) as OsceCase;
      const duration = 8 * 60;
      const initialSession: OsceSessionState = {
        caseId: caseData.id,
        casePresentation: caseData.presentation,
        caseFullDetails: caseData.fullDetails,
        patientSex: caseData.sex,
        difficulty: caseData.difficulty,
        timeRemaining: duration,
        duration,
        questionsAsked: [],
        missedKeyPoints: [],
        differentialAttempted: [],
        managementAttempted: [],
        riskFlags: [],
        startTime: Date.now(),
        status: "active",
        conversation: [{ role: "patient", content: caseData.presentation }],
      };

      sessionRef.current = initialSession;
      setSession(initialSession);
      setView("session");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to start OSCE";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  const handleMessage = useCallback(async (input: string): Promise<string> => {
    const currentSession = sessionRef.current;
    if (!currentSession) throw new Error("No active session");

    const response = await fetch("/api/osce/patient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: currentSession, userInput: input }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error || "Failed to get patient response");
    }

    const data = (await response.json()) as { response: string };

    setSession((previousSession) => {
      if (!previousSession) return previousSession;
      const updatedSession: OsceSessionState = {
        ...previousSession,
        questionsAsked: [
          ...previousSession.questionsAsked,
          { question: input, answer: data.response, timestamp: Date.now() },
        ],
        conversation: [
          ...previousSession.conversation,
          { role: "user" as const, content: input },
          { role: "patient" as const, content: data.response },
        ],
      };
      sessionRef.current = updatedSession;
      return updatedSession;
    });

    return data.response;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!session) return;
    setGrading(true);
    setError(null);
    try {
      const finalSession = { ...session, status: "submitted" as const };
      const response = await fetch("/api/osce/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: finalSession }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to grade session");
      }

      const result = (await response.json()) as OsceGradeResult;
      setGrade(result);
      setView("results");

      logOsceSession({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        score: result.score,
        breakdown: result.breakdown,
        difficulty: session.difficulty,
        passed: result.score >= 70,
        missedRedFlags: result.missed_red_flags.length,
        missedKeyQuestions: result.critical_mistakes.length,
        anchoringErrors: result.critical_mistakes.filter(
          (mistake) =>
            mistake.toLowerCase().includes("anchor") ||
            mistake.toLowerCase().includes("premature closure"),
        ).length,
        timestamp: Date.now(),
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to grade session";
      setError(message);
    } finally {
      setGrading(false);
    }
  }, [session]);

  const handleReset = useCallback(() => {
    setView("start");
    setSession(null);
    setGrade(null);
    setError(null);
  }, []);

  if (view === "session" && session) {
    return (
      <>
        {grading ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-5"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Surface className="w-full max-w-sm p-7 text-center">
              <LoaderCircle
                aria-hidden="true"
                className="mx-auto h-6 w-6 animate-spin text-accent motion-reduce:animate-none"
              />
              <p className="mt-4 font-semibold text-foreground">Preparing formative feedback</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Your interview is being compared with the generated station criteria.
              </p>
            </Surface>
          </div>
        ) : null}
        <OsceSession
          session={session}
          onMessage={handleMessage}
          onSubmit={handleSubmit}
          onBack={handleReset}
        />
      </>
    );
  }

  if (view === "results" && grade) {
    return (
      <AppShell
        onBack={handleReset}
        title="Station feedback"
        subtitle="Automated formative review"
      >
        <OsceResults grade={grade} onReset={handleReset} />
      </AppShell>
    );
  }

  return (
    <AppShell
      backHref="/dashboard"
      title="OSCE practice"
      subtitle="Timed simulated-patient interviews"
    >
      <div className="mx-auto w-full max-w-6xl space-y-7">
        <PageHeader
          eyebrow="Timed practice"
          title="OSCE history station"
          description="Interview a generated simulated patient for eight minutes, then review automated formative feedback."
          actions={
            <ButtonLink href="/osce/stats" variant="secondary">
              <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
              Practice history
            </ButtonLink>
          }
        />

        <Notice title="Educational simulation" tone="warning">
          The patient responses, station criteria, and feedback are AI-generated. This practice tool
          does not replace supervised teaching, validated assessment, or current clinical guidance.
        </Notice>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
          <Surface className="p-5 sm:p-6">
            <Badge tone="info">Station format</Badge>
            <h2 className="mt-4 text-xl font-semibold text-foreground">What to expect</h2>
            <ol className="mt-5 space-y-5">
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                  <Clock3 aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Eight-minute history</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Ask focused questions and submit whenever you are ready.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                  <MessageSquareText aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Simulated patient responses</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    The generated patient answers your questions without coaching or diagnostic hints.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                  <Volume2 aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Optional voice mode</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Use speech input and playback when supported, or complete the station by typing.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Formative review</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Review question coverage, safety topics, and a suggested response outline.
                  </p>
                </div>
              </li>
            </ol>
          </Surface>

          <Surface className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="section-label">Station setup</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Choose difficulty</h2>
              </div>
              <Badge>8 minutes</Badge>
            </div>

            <fieldset className="mt-5">
              <legend className="sr-only">Station difficulty</legend>
              <div className="space-y-2.5">
                {difficultyOptions.map((option) => {
                  const selected = difficulty === option.value;
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                        selected
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface hover:border-accent/35",
                      )}
                    >
                      <input
                        type="radio"
                        name="osce-difficulty"
                        value={option.value}
                        checked={selected}
                        onChange={() => setDifficulty(option.value)}
                        className="mt-1 h-4 w-4 accent-[var(--accent)]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {error ? (
              <Notice title="Station unavailable" tone="danger" className="mt-5">
                We could not prepare the station. Check your connection and try again; no practice
                history has been recorded.
              </Notice>
            ) : null}

            <Button
              onClick={() => void handleStart()}
              disabled={loading}
              className="mt-6 w-full"
              aria-describedby="osce-generation-note"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  />
                  Preparing station
                </>
              ) : (
                "Start station"
              )}
            </Button>
            <p id="osce-generation-note" className="mt-3 text-center text-xs leading-5 text-muted">
              Starting creates a new AI-generated station.
            </p>
          </Surface>
        </div>
      </div>
    </AppShell>
  );
}
