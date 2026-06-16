"use client";

import { use, useCallback, useState } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { AppShell, GlassCard, PrimaryButton } from "@/components/app-shell";
import { CasePlayer } from "@/components/teaching/case-player";
import { TeachingLoadingOverlay } from "@/components/teaching/teaching-loading-overlay";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import {
  getSeenDiseases,
  getSeenTitles,
  getSeenVignettes,
} from "@/lib/case-library";
import { getSubject } from "@/lib/teaching-subjects";
import type { GeneratedTeachingCase } from "@/lib/types";
import { cn } from "@/lib/utils";

type Difficulty = "easy" | "medium" | "hard";

const difficultyMeta: {
  key: Difficulty;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    key: "easy",
    label: "Easy",
    description: "Classic textbook presentations. Tests basic recall and recognition of common conditions.",
    icon: "🌱",
    color: "from-emerald-500/20 to-emerald-600/10",
  },
  {
    key: "medium",
    label: "Medium",
    description: "Moderately complex cases requiring clinical reasoning. Plausible distractors.",
    icon: "🔥",
    color: "from-amber-500/20 to-amber-600/10",
  },
  {
    key: "hard",
    label: "Hard",
    description: "Atypical presentations with tricky distractors. Tests higher-order clinical judgment.",
    icon: "💎",
    color: "from-red-500/20 to-red-600/10",
  },
];

export default function SubjectCasePage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: subjectId } = use(params);
  const subjectInfo = getSubject(subjectId);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [teachingCase, setTeachingCase] = useState<GeneratedTeachingCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCase = useCallback(async (selectedDifficulty: Difficulty) => {
    if (!subjectInfo) return;
    setDifficulty(selectedDifficulty);
    setLoading(true);
    setError(null);
    setTeachingCase(null);

    try {
      const res = await fetch("/api/teaching/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectId,
          difficulty: selectedDifficulty,
          avoidTitles: getSeenTitles(subjectId),
          avoidDiseases: getSeenDiseases(subjectId),
          avoidVignettes: getSeenVignettes(subjectId),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? data.error ?? "Failed to generate case");
        return;
      }

      const data = await res.json();
      setTeachingCase(data.case);
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }, [subjectId, subjectInfo]);

  const handleReset = useCallback(() => {
    setDifficulty(null);
    setTeachingCase(null);
    setError(null);
  }, []);

  if (!subjectInfo) notFound();

  if (!difficulty && !teachingCase) {
    return (
      <AppShell
        backHref="/teaching"
        title={subjectInfo.name}
        subtitle={subjectInfo.description}
      >
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <span className="text-5xl">{subjectInfo.icon}</span>
            <h2 className="mt-4 text-xl font-semibold">Choose difficulty</h2>
            <p className="mt-2 text-sm text-muted">
              Select the difficulty level for your teaching session. Each
              session generates 3 unique patient cases with MCQs.
            </p>
          </div>
          <StaggerContainer className="grid gap-4 sm:grid-cols-3">
            {difficultyMeta.map((d) => (
              <StaggerItem key={d.key}>
                <motion.button
                  type="button"
                  onClick={() => generateCase(d.key)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full w-full text-left"
                >
                  <GlassCard
                    className={cn(
                      "group h-full cursor-pointer border-transparent transition-all hover:border-accent/40",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br",
                        d.color,
                      )}
                    >
                      <span className="text-2xl">{d.icon}</span>
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-accent">
                      {d.label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {d.description}
                    </p>
                  </GlassCard>
                </motion.button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <>
        <TeachingLoadingOverlay visible={true} />
        <AppShell backHref="/teaching" title="Generating session..." subtitle="AI is building 3 unique patients">
          <div className="invisible" />
        </AppShell>
      </>
    );
  }

  if (error) {
    return (
      <AppShell backHref="/teaching" title="Generation failed">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <GlassCard>
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-lg font-semibold">No cached content available</h2>
                <p className="max-w-sm text-sm leading-relaxed text-muted">
                  {error}
                </p>
                <div className="mt-2 rounded-xl border border-border/50 bg-surface/50 p-4 text-left text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Why this happens
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    New cases must be generated in real-time to ensure learning
                    quality. The AI system was unable to create a fresh,
                    unique set of questions for this session.
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <PrimaryButton onClick={() => difficulty && generateCase(difficulty)}>
                    Try again
                  </PrimaryButton>
                  <PrimaryButton onClick={handleReset}>
                    Change difficulty
                  </PrimaryButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  if (!teachingCase) return null;

  return (
    <CasePlayer
      teachingCase={teachingCase}
      backHref="/teaching"
      showNewCase
      onNewCase={handleReset}
    />
  );
}
