"use client";

import { useState, useCallback } from "react";
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
      if (!session) throw new Error("No active session");

      const res = await fetch("/api/osce/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, userInput: input }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to get patient response");
      }

      const data = (await res.json()) as { response: string };

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questionsAsked: [
            ...prev.questionsAsked,
            { question: input, answer: data.response, timestamp: Date.now() },
          ],
          conversation: [
            ...prev.conversation,
            { role: "user", content: input },
            { role: "patient", content: data.response },
          ],
        };
      });

      return data.response;
    },
    [session],
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
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-surface/80 text-lg text-muted backdrop-blur-md transition hover:border-accent/40"
          >
            ←
          </Link>
          <div className="flex-1">
            <p className="text-sm font-medium">OSCE Examiner Mode</p>
            <p className="text-xs text-muted">Real clinical exam simulation</p>
          </div>
          <Link
            href="/osce/stats"
            className="rounded-full border border-border/60 bg-surface/70 px-3 py-1.5 text-[11px] font-medium text-muted backdrop-blur-md transition hover:border-accent/40 hover:text-accent"
          >
            Stats
          </Link>
        </header>

        <div className="flex flex-1 items-start justify-center pt-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <GlassCard>
              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15">
                  <span className="text-3xl">🩺</span>
                </div>
                <h1 className="text-center text-2xl font-bold">OSCE Station</h1>
                <p className="mt-2 text-center text-sm text-muted">
                  You are about to enter a simulated OSCE station. The AI will act as a patient. No hints, no
                  guidance — only your clinical skills.
                </p>
              </div>

              <div className="mb-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Difficulty</p>
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

              <div className="mb-6 space-y-3 rounded-xl border border-border/60 bg-surface/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Rules</p>
                <ul className="space-y-1.5 text-xs text-muted">
                  <li className="flex gap-2">
                    <span className="text-accent">•</span>
                    You have <strong>8 minutes</strong> to take a history
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">•</span>
                    Ask questions freely — the AI responds as the patient
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">•</span>
                    No hints or coaching will be given
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">•</span>
                    Click &ldquo;Submit OSCE&rdquo; when done for grading
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">•</span>
                    The examiner will evaluate: History (40%), Differentials (20%), Investigations (20%),
                    Management (20%)
                  </li>
                </ul>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <PrimaryButton onClick={handleStart} disabled={loading} className="w-full py-4 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating case...
                  </span>
                ) : (
                  "Start OSCE Station"
                )}
              </PrimaryButton>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
