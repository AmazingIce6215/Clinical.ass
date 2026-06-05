"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell, GlassCard } from "@/components/app-shell";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { useAuth } from "@/context/auth-context";
import { getPersonalGreeting } from "@/lib/auth";

const modes = [
  {
    href: "/clinical",
    title: "Clincalass Companion",
    description:
      "Real-life workup: triage, targeted HPI, exam, investigations → diagnosis, differentials & management.",
    icon: "🩺",
    accent: "from-blue-500/20 to-cyan-500/10",
  },
  {
    href: "/classic",
    title: "Classic Mode",
    description:
      "Full ward-round history taking — build a structured case presentation for your consultant.",
    icon: "📋",
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    href: "/teaching",
    title: "Teaching Mode",
    description:
      "Case-based Q-bank with 3 unique patient vignettes per session, MCQs, and detailed explanations.",
    icon: "📚",
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
];

export default function HomePage() {
  const { session } = useAuth();
  const [greeting, setGreeting] = useState(() => getPersonalGreeting(session?.firstName ?? ""));

  useEffect(() => {
    setGreeting(getPersonalGreeting(session?.firstName ?? ""));
  }, [session]);

  return (
    <AppShell>
      <section className="mx-auto flex max-w-4xl flex-1 flex-col justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/10 text-5xl shadow-inner text-muted">
            <span>🩺</span>
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-base font-semibold uppercase tracking-[0.32em] text-accent/90 sm:text-sm">
              {greeting}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Welcome to Clinicalass.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-muted sm:text-xl">
              A personalized AI companion for clinical reasoning, case review, and medical learning.
            </p>
          </div>
        </motion.div>

        <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode) => (
            <StaggerItem key={mode.href}>
              <Link href={mode.href} className="block h-full">
                <GlassCard
                  hover
                  className={`group relative h-full overflow-hidden bg-gradient-to-br ${mode.accent}`}
                >
                  <div className="relative z-10">
                    <span className="text-3xl">{mode.icon}</span>
                    <h2 className="mt-4 text-xl font-semibold transition-colors group-hover:text-accent">
                      {mode.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{mode.description}</p>
                    <p className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                      Open
                      <motion.span className="inline-block" whileHover={{ x: 4 }}>
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
