"use client";

import { useState } from "react";
import { BrainCanvas } from "./brain-canvas";
import { SecondaryButton } from "@/components/app-shell";
import { GlassCard } from "@/components/app-shell";
import { motion } from "framer-motion";

export function BrainHero() {
  const [thinkingMode, setThinkingMode] = useState(true);

  return (
    <GlassCard className="brain-hero-panel relative flex h-full min-h-[34rem] flex-col overflow-hidden p-0">
      <div className="brain-hero-panel__backdrop" />
      <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="shell-kicker">Clinical intelligence</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-[2rem]">
              The AI engine, visualized.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              A live 3D brain that breathes, pulses, and shifts as reasoning moves through the system.
            </p>
          </div>
          <div className="hidden rounded-full border border-border/70 bg-surface/55 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-md sm:block">
            60fps focus
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <BrainCanvas thinkingMode={thinkingMode} className="h-full w-full" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SecondaryButton onClick={() => setThinkingMode((value) => !value)}>
            {thinkingMode ? "Thinking mode on" : "Thinking mode off"}
          </SecondaryButton>
          <motion.div
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="ui-pill ui-pill--accent"
          >
            Radiology active
          </motion.div>
        </div>
      </div>
    </GlassCard>
  );
}
