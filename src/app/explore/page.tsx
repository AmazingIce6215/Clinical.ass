"use client";

import Link from "next/link";
import { AppShell, GlassCard } from "@/components/app-shell";
import { StaggerContainer, StaggerItem } from "@/components/motion";

const modules = [
  {
    href: "/clinical",
    title: "Clinical reasoning",
    icon: "\uD83E\uDE7A",
    desc: "Walk through real symptom-led cases with AI differentials, exam steps, and next-step guidance.",
  },
  {
    href: "/osce",
    title: "OSCE examiner",
    icon: "\uD83C\uDF93",
    desc: "Timed, exam-style stations with a patient voice, live grading, and detailed performance feedback.",
  },
  {
    href: "/teaching",
    title: "Teaching bank",
    icon: "\uD83D\uDCDA",
    desc: "Case-based MCQs that build memory, pattern recognition, and clinical judgment over time.",
  },
  {
    href: "/calculators",
    title: "Calculators",
    icon: "\uD83D\uDCCA",
    desc: "Quick access to the high-yield scores and decision tools you actually use on the wards.",
  },
  {
    href: "/image-diagnosis",
    title: "Image diagnosis",
    icon: "\uD83D\uDDBC\uFE0F",
    desc: "Upload a clinical image and get a structured, image-first diagnostic read.",
  },
  {
    href: "/library",
    title: "Case library",
    icon: "\uD83D\uDCC2",
    desc: "Return to saved cases, presentations, and teaching sessions whenever you need them.",
  },
];

export default function ExplorePage() {
  return (
    <AppShell backHref="/" title="Explore all modules" subtitle="One app, multiple clinical workflows">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <GlassCard className="glass-card--hero">
          <p className="shell-kicker">All modules</p>
          <h1 className="shell-heading mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
            Explore the platform
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Each module is tuned for a different part of the clinical journey, but they all share the
            same visual language and interaction rhythm.
          </p>
        </GlassCard>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => (
            <StaggerItem key={m.href}>
              <Link href={m.href}>
                <GlassCard hover className="module-card glass-card--action h-full">
                  <div className="flex items-start justify-between gap-4">
                    <span className="module-card__icon text-2xl">{m.icon}</span>
                    <span className="ui-pill">Open</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="module-card__title">{m.title}</h3>
                    <p className="module-card__desc">{m.desc}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                    Enter module
                    <span aria-hidden="true">&rarr;</span>
                  </span>
                </GlassCard>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </AppShell>
  );
}
