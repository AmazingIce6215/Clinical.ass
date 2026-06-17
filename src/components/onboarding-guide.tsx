"use client";

import { motion, AnimatePresence } from "framer-motion";

function ModeRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-surface/50 p-3">
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted leading-relaxed mt-0.5">{desc}</p>
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
            className="w-full max-w-lg overflow-y-auto max-h-[85vh] rounded-3xl border border-border/60 bg-surface/90 backdrop-blur-xl p-6 shadow-2xl"
          >
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">👋</p>
              <h2 className="text-xl font-semibold text-foreground">
                Hey{userName ? ` ${userName}` : ""}, welcome aboard!
              </h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Thanks for trying out Clinical.ass! Here&apos;s a quick overview of what you can do.
              </p>
            </div>

            <div className="space-y-3 mb-5">
              <ModeRow icon="🩺" title="Companion" desc="Real clinical workup — triage, history, exam, investigations, then diagnosis with differentials." />
              <ModeRow icon="📋" title="Classic" desc="Full ward-round history taking to build a structured case presentation." />
              <ModeRow icon="📚" title="Teaching" desc="Case-based Q-bank with patient vignettes, MCQs, and detailed explanations." />
              <ModeRow icon="🖼️" title="Image Diagnosis" desc="Upload a medical image and get a visual impression with key findings." />
              <ModeRow icon="📊" title="Calculators" desc="Evidence-based scoring tools: GCS, CURB-65, Wells, HEART, SOFA, and more." />
              <ModeRow icon="🎓" title="OSCE Examiner" desc="Timed OSCE station with AI patient simulation and strict grading." />
            </div>

            <div className="rounded-2xl border border-border/50 bg-surface/60 p-4 mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">A quick heads-up</p>
              <p className="text-sm text-muted leading-relaxed">
                This app runs on free tiers of Groq and Gemini APIs, so responses may occasionally be slow or fail.
                Don&apos;t let that stop you — just hit retry and it usually works fine.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-surface/60 p-4 mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Got feedback?</p>
              <p className="text-sm text-muted leading-relaxed">
                Anytime you have a suggestion or run into something odd, tap your avatar and use{" "}
                <span className="font-medium text-foreground">Meet the Developer</span> to send a message directly. I read every one.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-accent px-5 py-3 text-base font-semibold text-accent-foreground transition hover:bg-accent/90"
            >
              Let&apos;s go
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
