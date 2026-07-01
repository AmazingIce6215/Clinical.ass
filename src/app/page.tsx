"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { AppShell, ButtonLink, GlassCard } from "@/components/app-shell";
import { HeroRightPanel } from "@/components/hero-anatomy/hero-right-panel";

function greetingLine(name: string) {
  if (!name) return "Welcome to a sharper clinical workspace";
  return `Welcome back, ${name}`;
}

export default function HomePage() {
  const { session } = useAuth();
  const firstName = session?.firstName?.trim() ?? "";

  return (
    <AppShell>
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 pb-4 pt-4 sm:gap-10 lg:pt-8">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:items-start">
          <GlassCard className="glass-card--hero p-7 sm:p-9">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl"
            >
              <p className="shell-kicker mb-3">{greetingLine(firstName)}</p>
              <h1 className="shell-heading max-w-2xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl lg:text-7xl">
                Clinical reasoning, exam practice, and decision support.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                A polished, high-signal environment for working through cases, training your exam flow,
                and moving faster from symptom to safe clinical answer.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <ButtonLink href="/clinical" variant="primary" className="px-6 py-3.5">
                  Start a clinical case
                </ButtonLink>
                <ButtonLink href="/osce" className="px-6 py-3.5">
                  Launch OSCE mode
                </ButtonLink>
                <ButtonLink href="/teaching" className="px-6 py-3.5">
                  Open teaching bank
                </ButtonLink>
                <ButtonLink href="/image-diagnosis" className="px-6 py-3.5">
                  Image diagnosis
                </ButtonLink>
                <ButtonLink href="/calculators" className="px-6 py-3.5">
                  Calculator
                </ButtonLink>
                <ButtonLink href="/case-report" className="px-6 py-3.5">
                  Case report
                </ButtonLink>
              </div>

              <Link
                href="/explore"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:gap-2"
              >
                See all modules
                <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </GlassCard>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroRightPanel />
          </motion.div>
        </section>
      </div>
    </AppShell>
  );
}
