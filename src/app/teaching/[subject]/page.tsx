"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { AppShell, GlassCard, PrimaryButton } from "@/components/app-shell";
import { CasePlayer } from "@/components/teaching/case-player";
import { TeachingLoadingOverlay } from "@/components/teaching/teaching-loading-overlay";
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

  const fetchInitRef = useRef(false);

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

  useEffect(() => {
    if (!subjectInfo || fetchInitRef.current) return;
    fetchInitRef.current = true;
    generateCase();
  }, [subjectInfo, generateCase]);

  if (!subjectInfo) notFound();

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
                <PrimaryButton className="mt-2" onClick={generateCase}>
                  Try again
                </PrimaryButton>
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
      onNewCase={generateCase}
    />
  );
}
