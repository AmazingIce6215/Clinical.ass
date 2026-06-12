"use client";

import { use, useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { AppShell, GlassCard, PrimaryButton } from "@/components/app-shell";
import { CasePlayer } from "@/components/teaching/case-player";
import { FadeSlide } from "@/components/motion";
import { LoadingPanel } from "@/components/loading-panel";
import {
  getSeenDiseases,
  getSeenTitles,
  getSeenVignettes,
} from "@/lib/case-library";
import { getSubject } from "@/lib/teaching-subjects";
import type { GeneratedTeachingCase } from "@/lib/types";

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
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const generateCase = useCallback(async () => {
    if (!subjectInfo) return;
    setLoading(true);
    setError(null);
    setAiNotice(null);
    setTeachingCase(null);

    try {
      const res = await fetch("/api/teaching/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectId,
          avoidTitles: getSeenTitles(subjectId),
          avoidDiseases: getSeenDiseases(subjectId),
          avoidVignettes: getSeenVignettes(subjectId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate case");
        return;
      }

      setTeachingCase(data.case);
      if (!data.aiPowered && data.aiError) {
        setAiNotice(data.aiError);
      }
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }, [subjectId, subjectInfo]);

  useEffect(() => {
    if (!subjectInfo) return;
    void (async () => {
      await generateCase();
    })();
  }, [subjectInfo, generateCase]);

  if (!subjectInfo) notFound();

  if (loading) {
    return (
      <>
        <LoadingPanel visible={true} fullScreen mode="teaching" />
        <AppShell backHref="/teaching" title="Generating session..." subtitle="AI is building 3 unique patients">
          <div className="invisible" />
        </AppShell>
      </>
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
    <>
      {aiNotice && (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto max-w-2xl px-4">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 backdrop-blur-md dark:text-amber-100">
            {aiNotice}
          </div>
        </div>
      )}
      <CasePlayer
        teachingCase={teachingCase}
        backHref="/teaching"
        showNewCase
        onNewCase={generateCase}
      />
    </>
  );
}
