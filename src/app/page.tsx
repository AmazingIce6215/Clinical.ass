"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { AppShell, ButtonLink, GlassCard } from "@/components/app-shell";
import { cn } from "@/lib/utils";

const modules = [
  {
    href: "/clinical",
    title: "Clinical reasoning",
    icon: "🩺",
    desc: "Walk through real symptom-led cases with AI differentials, exam steps, and next-step guidance.",
    accent: "from-teal-500/15 to-cyan-500/10",
  },
  {
    href: "/osce",
    title: "OSCE examiner",
    icon: "🎓",
    desc: "Timed, exam-style stations with a patient voice, live grading, and detailed performance feedback.",
    accent: "from-sky-500/15 to-indigo-500/10",
  },
  {
    href: "/teaching",
    title: "Teaching bank",
    icon: "📚",
    desc: "Case-based MCQs that build memory, pattern recognition, and clinical judgment over time.",
    accent: "from-violet-500/15 to-fuchsia-500/10",
  },
  {
    href: "/calculators",
    title: "Calculators",
    icon: "📊",
    desc: "Quick access to the high-yield scores and decision tools you actually use on the wards.",
    accent: "from-amber-500/15 to-orange-500/10",
  },
  {
    href: "/image-diagnosis",
    title: "Image diagnosis",
    icon: "🖼️",
    desc: "Upload a clinical image and get a structured, image-first diagnostic read.",
    accent: "from-emerald-500/15 to-lime-500/10",
  },
  {
    href: "/library",
    title: "Case library",
    icon: "🗂️",
    desc: "Return to saved cases, presentations, and teaching sessions whenever you need them.",
    accent: "from-stone-500/15 to-zinc-500/10",
  },
];

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
            </motion.div>
          </GlassCard>


        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="shell-kicker">Explore the platform</p>
              <h2 className="shell-heading mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                One app, multiple clinical workflows
              </h2>
            </div>
            <p className="hidden max-w-sm text-sm leading-6 text-muted sm:block">
              Each module is tuned for a different part of the clinical journey, but they all share the
              same visual language and interaction rhythm.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module, index) => (
              <motion.div
                key={module.href}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlassCard hover className={cn("module-card bg-gradient-to-br", module.accent)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="module-card__icon">{module.icon}</div>
                    <span className="ui-pill">Open</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="module-card__title">{module.title}</h3>
                    <p className="module-card__desc">{module.desc}</p>
                  </div>
                  <Link
                    href={module.href}
                    className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:gap-2"
                  >
                    Enter module
                    <span aria-hidden="true">→</span>
                  </Link>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
