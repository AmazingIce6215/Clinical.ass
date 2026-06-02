"use client";

import { use, useCallback, useEffect, useState } from "react";
import { AppShell, GlassCard, PrimaryButton } from "@/components/app-shell";
import { CasePlayer } from "@/components/teaching/case-player";
import { FadeSlide } from "@/components/motion";
import { getSubject } from "@/lib/teaching-subjects";
import { getSeenTitles } from "@/lib/teaching-storage";
import type { GeneratedTeachingCase } from "@/lib/types";
import { notFound } from "next/navigation";

export default function SubjectCasePage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: subjectId } = use(params);
  const subjectInfo = getSubject(subjectId);
  const [teachingCase, setTeachingCase] = useState<GeneratedTeachingCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateCase = useCallback(async () => {
    if (!subjectInfo) return;
    setLoading(true);
    setError(null);
    setTeachingCase(null);

    try {
      const res = await fetch("/api/teaching/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectId,
          avoidTitles: getSeenTitles(subjectId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate case");
        return;
      }

      setTeachingCase(data.case);
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }, [subjectId, subjectInfo]);

  useEffect(() => {
    if (subjectInfo) generateCase();
  }, [subjectInfo, generateCase]);

  if (!subjectInfo) notFound();

  if (loading) {
    return (
      <AppShell backHref="/teaching" title="Generating case..." subtitle="AI is building your vignette">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24">
          <FadeSlide>
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-accent/10" />
            </div>
          </FadeSlide>
          <p className="mt-6 text-sm text-muted">Creating a unique case for you...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell backHref="/teaching" title="Generation failed">
        <GlassCard className="mx-auto max-w-md text-center">
          <p className="text-muted">{error}</p>
          <PrimaryButton className="mt-6" onClick={generateCase}>
            Try again
          </PrimaryButton>
        </GlassCard>
      </AppShell>
    );
  }

  if (!teachingCase) return null;

  return (
    <CasePlayer
      teachingCase={teachingCase}
      backHref="/teaching"
      showNewCase
      onNewCase={generateCase}
    />
  );
}
