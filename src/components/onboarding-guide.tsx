"use client";

import { motion, AnimatePresence } from "framer-motion";

function ModeRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border/50 bg-surface/50 p-2.5 sm:gap-3 sm:p-3">
      <span className="text-lg shrink-0 sm:text-xl">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-foreground sm:text-sm">{title}</p>
        <p className="text-[11px] text-muted leading-relaxed mt-0.5 sm:text-xs">{desc}</p>
      </div>
    </div>
  );
}

export function OnboardingGuide({
  open,
  onClose,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  userName?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg overflow-y-auto max-h-[85vh] rounded-3xl border border-border/60 bg-surface/90 backdrop-blur-xl p-5 shadow-2xl sm:p-6"
          >
            <div className="text-center mb-4 sm:mb-5">
              <p className="text-2xl mb-1 sm:text-3xl sm:mb-2">👋</p>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Hey{userName ? ` ${userName}` : ""}, welcome aboard!
              </h2>
              <p className="mt-1 text-xs text-muted leading-relaxed sm:mt-2 sm:text-sm">
                Thanks for trying Clinical.ass! Here&apos;s a quick overview of what you can do.
              </p>
            </div>

            <div className="space-y-2 mb-4 sm:space-y-3 sm:mb-5">
              <ModeRow icon="🩺" title="Companion" desc="Real clinical workup — triage, history, exam, investigations, then diagnosis with differentials and a Co-Pilot thinking coach." />
              <ModeRow icon="📋" title="Classic" desc="Full ward-round history taking to build a structured case presentation for your consultant." />
              <ModeRow icon="📚" title="Teaching" desc="Case-based Q-bank with patient vignettes, MCQs, and detailed explanations. Save cases to your Library for later review." />
              <ModeRow icon="🖼️" title="Image Diagnosis" desc="Upload a medical image and get a visual impression with key findings and standard management." />
              <ModeRow icon="📊" title="Calculators" desc="Evidence-based scoring tools: GCS, CURB-65, Wells, HEART, CHA₂DS₂-VASc, SOFA, and more." />
              <ModeRow icon="🎓" title="OSCE Examiner" desc="Timed OSCE station with AI patient simulation, history taking, and strict grading." />
            </div>

            <div className="rounded-2xl border border-border/50 bg-surface/60 p-3 mb-3 sm:p-4 sm:mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1 sm:text-xs sm:mb-1.5">A quick heads-up</p>
              <p className="text-xs text-muted leading-relaxed sm:text-sm">
                This app runs on free tiers of Groq and Gemini APIs, so responses may occasionally be slow or fail.
                Don&apos;t let that stop you — just hit retry and it usually works fine.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-surface/60 p-3 mb-4 sm:p-4 sm:mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1 sm:text-xs sm:mb-1.5">Got feedback?</p>
              <p className="text-xs text-muted leading-relaxed sm:text-sm">
                Anytime you have a suggestion or run into something odd, tap your avatar and use{" "}
                <span className="font-medium text-foreground">Meet the Developer</span> to send a message directly. I read every one.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 sm:text-base"
            >
              Let&apos;s go
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
