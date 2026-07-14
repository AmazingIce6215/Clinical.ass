"use client";

import {
  BookOpen,
  CircleAlert,
  Layers3,
  RefreshCcw,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { notFound } from "next/navigation";
import { use, useCallback, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CasePlayer } from "@/components/teaching/case-player";
import { TeachingLoadingOverlay } from "@/components/teaching/teaching-loading-overlay";
import { TeachingSubjectIcon } from "@/components/teaching/subject-icon";
import { Badge, Button, Notice, PageHeader, Surface } from "@/components/ui/primitives";
import {
  getSeenDiseases,
  getSeenTitles,
  getSeenVignettes,
} from "@/lib/case-library";
import { getSubject } from "@/lib/teaching-subjects";
import type { GeneratedTeachingCase } from "@/lib/types";

type Difficulty = "easy" | "medium" | "hard";

const difficultyMeta: Array<{
  key: Difficulty;
  label: string;
  level: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    key: "easy",
    label: "Easy",
    level: "Foundational",
    description: "Common textbook presentations focused on recall and pattern recognition.",
    Icon: BookOpen,
  },
  {
    key: "medium",
    label: "Medium",
    level: "Applied",
    description: "Cases requiring clinical reasoning across several plausible options.",
    Icon: Layers3,
  },
  {
    key: "hard",
    label: "Hard",
    level: "Advanced",
    description: "Atypical presentations requiring careful discrimination between options.",
    Icon: Waypoints,
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

  const generateCase = useCallback(
    async (selectedDifficulty: Difficulty) => {
      if (!subjectInfo) return;
      setDifficulty(selectedDifficulty);
      setLoading(true);
      setError(null);
      setTeachingCase(null);

      try {
        const response = await fetch("/api/teaching/generate", {
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

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data.detail ?? data.error ?? "generation-failed");
          return;
        }

        const data = await response.json();
        setTeachingCase(data.case);
      } catch {
        setError("network-error");
      } finally {
        setLoading(false);
      }
    },
    [subjectId, subjectInfo],
  );

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
        <div className="mx-auto w-full max-w-5xl space-y-7">
          <PageHeader
            eyebrow="Teaching bank"
            title={subjectInfo.name}
            description="Select a difficulty to generate a three-question practice session."
            actions={
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-border bg-surface text-accent">
                <TeachingSubjectIcon name={subjectInfo.icon} className="h-5 w-5" />
              </span>
            }
          />

          <Notice title="Generated session" tone="info">
            The cases and explanations are created when you begin. Treat them as formative study
            material and verify clinical details against current guidance.
          </Notice>

          <fieldset>
            <legend className="text-base font-semibold text-foreground">Choose difficulty</legend>
            <p className="mt-1 text-sm leading-6 text-muted">
              Difficulty changes presentation complexity and distractor similarity; it does not
              indicate clinical competence.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {difficultyMeta.map(({ key, label, level, description, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => void generateCase(key)}
                  className="group h-full min-h-11 rounded-[14px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label={`Generate a ${label.toLowerCase()} ${subjectInfo.name} session`}
                >
                  <Surface className="flex h-full flex-col p-5 transition-colors group-hover:border-accent/35 group-hover:bg-surface-subtle">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                        <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <Badge>{level}</Badge>
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-foreground">{label}</h2>
                    <p className="mt-1 flex-1 text-sm leading-6 text-muted">{description}</p>
                    <span className="mt-5 text-sm font-semibold text-accent">Generate session</span>
                  </Surface>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <>
        <TeachingLoadingOverlay visible />
        <AppShell
          backHref="/teaching"
          title="Preparing teaching session"
          subtitle={`${subjectInfo.name} · ${difficulty}`}
        >
          <div aria-hidden="true" />
        </AppShell>
      </>
    );
  }

  if (error) {
    return (
      <AppShell
        backHref="/teaching"
        title="Teaching session unavailable"
        subtitle={subjectInfo.name}
      >
        <div className="mx-auto w-full max-w-xl">
          <Surface className="p-6 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-warning-soft text-warning">
              <CircleAlert aria-hidden="true" className="h-5 w-5" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold text-foreground">
              We could not prepare this session
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              The generation service did not return a complete case set. Your existing progress and
              saved cases have not been changed.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => difficulty && void generateCase(difficulty)}>
                <RefreshCcw aria-hidden="true" className="h-4 w-4" />
                Try again
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Change difficulty
              </Button>
            </div>
          </Surface>
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
