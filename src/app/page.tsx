"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell, GlassCard } from "@/components/app-shell";
import { StaggerContainer, StaggerItem } from "@/components/motion";

const modes = [
  {
    href: "/clinical",
    title: "Clinical Companion",
    description:
      "Guided patient workup — demographics, history, exam, differentials, and management. One step at a time.",
    icon: "🩺",
    accent: "from-blue-500/20 to-cyan-500/10",
  },
  {
    href: "/teaching",
    title: "Teaching Mode",
    description:
      "Case-based Q-bank with vignettes, MCQs, and detailed explanations — Amboss-style learning.",
    icon: "📚",
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <section className="mx-auto flex max-w-4xl flex-1 flex-col justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <motion.div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-accent-foreground shadow-glow"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            Dx
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            DxFlow
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            Clinical reasoning, reimagined. A fluid step-by-step workup for real
            cases, and case-based teaching for exam prep.
          </p>
          <p className="mt-3 text-xs text-muted/80">
            Follows your system light/dark appearance · Educational use only
          </p>
        </motion.div>

        <StaggerContainer className="grid gap-5 sm:grid-cols-2">
          {modes.map((mode) => (
            <StaggerItem key={mode.href}>
              <Link href={mode.href} className="block h-full">
                <GlassCard hover className={`group relative h-full overflow-hidden bg-gradient-to-br ${mode.accent}`}>
                  <div className="relative z-10">
                    <span className="text-3xl">{mode.icon}</span>
                    <h2 className="mt-4 text-xl font-semibold group-hover:text-accent transition-colors">
                      {mode.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {mode.description}
                    </p>
                    <p className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                      Open
                      <motion.span
                        className="inline-block"
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                      >
                        →
                      </motion.span>
                    </p>
                  </div>
                </GlassCard>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </AppShell>
  );
}
