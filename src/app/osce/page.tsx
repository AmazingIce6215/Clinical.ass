"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { GlassCard, PrimaryButton } from "@/components/app-shell";
import Link from "next/link";
import { SegmentedControl } from "@/components/ui/inputs";
import { OsceSession } from "@/app/osce/session";
import { OsceResults } from "@/app/osce/results";
import { logOsceSession } from "@/lib/osce-stats";
import type {
  OsceSessionState,
  OsceGradeResult,
  OsceCase,
  Difficulty,
} from "@/lib/osce/state";

type View = "start" | "session" | "results";

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
      const res = await fetch("/api/osce/generate-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Failed to generate case");
      }

      const caseData = (await res.json()) as OsceCase;
      const duration = 8 * 60; // 8 minutes default

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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start OSCE";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  const handleMessage = useCallback(
    async (input: string): Promise<string> => {
      const currentSession = sessionRef.current;
      if (!currentSession) throw new Error("No active session");

      const res = await fetch("/api/osce/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: currentSession, userInput: input }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to get patient response");
      }

      const data = (await res.json()) as { response: string };

      setSession((prev) => {
        if (!prev) return prev;
        const updated: OsceSessionState = {
          ...prev,
          questionsAsked: [
            ...prev.questionsAsked,
            { question: input, answer: data.response, timestamp: Date.now() },
          ],
          conversation: [
            ...prev.conversation,
            { role: "user" as const, content: input },
            { role: "patient" as const, content: data.response },
          ],
        };
        sessionRef.current = updated;
        return updated;
      });

      return data.response;
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!session) return;
    setGrading(true);
    try {
      const finalSession = {
        ...session,
        status: "submitted" as const,
      };

      const res = await fetch("/api/osce/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: finalSession }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to grade session");
      }

      const result = (await res.json()) as OsceGradeResult;
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
          (m) => m.toLowerCase().includes("anchor") || m.toLowerCase().includes("premature closure"),
        ).length,
        timestamp: Date.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to grade session";
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

  const handleBack = useCallback(() => {
    handleReset();
  }, [handleReset]);

  if (view === "session" && session) {
    return (
      <>
        {grading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-md">
            <div className="rounded-2xl border border-border/60 bg-surface/80 p-12 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
              <p className="mt-4 text-sm font-medium text-muted">Grading your OSCE...</p>
            </div>
          </div>
        )}
        <OsceSession
          session={session}
          onMessage={handleMessage}
          onSubmit={handleSubmit}
          onBack={handleBack}
        />
      </>
    );
  }

  if (view === "results" && grade) {
    return (
      <div className="relative mx-auto min-h-dvh max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <OsceResults grade={grade} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-90" />
      <div className="app-shell-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-7xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-surface/80 text-lg text-muted shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
          >
            ←
          </Link>
          <div className="flex items-center gap-2">
            <span className="ui-pill ui-pill--accent">Exam mode</span>
            <Link href="/osce/stats" className="ui-pill">
              Stats
            </Link>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <GlassCard className="glass-card--hero p-7 sm:p-9">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="ui-pill ui-pill--accent">Timed simulation</span>
                <span className="ui-pill">Patient voice + strict grading</span>
              </div>
              <p className="shell-kicker mb-3">OSCE examiner mode</p>
              <h1 className="shell-heading max-w-3xl text-4xl font-semibold tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                A calm, focused exam room for high-pressure practice.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Enter a clinically realistic station with a patient voice, timed flow, and examiner
                feedback that looks and feels like a premium assessment experience.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Timer</p>
                  <p className="metric-value mt-2">8 min</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Focus</p>
                  <p className="metric-value mt-2">History</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Scoring</p>
                  <p className="metric-value mt-2">100</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <p className="shell-kicker">Why this mode feels better</p>
              <ul className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2">
                <li className="rounded-2xl border border-border/60 bg-surface/45 p-4">
                  Clear structure keeps you grounded under pressure.
                </li>
                <li className="rounded-2xl border border-border/60 bg-surface/45 p-4">
                  Voice mode supports natural, interview-like pacing.
                </li>
                <li className="rounded-2xl border border-border/60 bg-surface/45 p-4">
                  The grader rewards systematic history and safety.
                </li>
                <li className="rounded-2xl border border-border/60 bg-surface/45 p-4">
                  Results are laid out like an actual examiner report.
                </li>
              </ul>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard className="glass-card--hero p-6 sm:p-7">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="shell-kicker">Station setup</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    Pick your difficulty
                  </p>
                </div>
                <div className="ui-pill ui-pill--accent">Ready</div>
              </div>

              <div className="mb-6">
                <SegmentedControl<Difficulty>
                  options={[
                    { label: "Easy", value: "easy" },
                    { label: "Medium", value: "medium" },
                    { label: "Hard", value: "hard" },
                  ]}
                  value={difficulty}
                  onChange={setDifficulty}
                />
              </div>

              <div className="space-y-3">
                <p className="shell-kicker">Exam rules</p>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex gap-2"><span className="text-accent">•</span>You have 8 minutes to take a history.</li>
                  <li className="flex gap-2"><span className="text-accent">•</span>The AI acts as the patient, not an examiner.</li>
                  <li className="flex gap-2"><span className="text-accent">•</span>No hints, no coaching, just clinical responses.</li>
                  <li className="flex gap-2"><span className="text-accent">•</span>Submit when you are done and the station will be graded.</li>
                </ul>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <PrimaryButton onClick={handleStart} disabled={loading} className="mt-6 w-full py-4 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating case...
                  </span>
                ) : (
                  "Start OSCE station"
                )}
              </PrimaryButton>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
