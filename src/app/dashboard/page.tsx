"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Clock3, ShieldCheck, X, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { ModuleIcon } from "@/components/ui/icons";
import { Badge, Notice, PageHeader, Surface } from "@/components/ui/primitives";
import { useAuth } from "@/context/auth-context";
import { searchLibrary } from "@/lib/case-library";
import { modules, moduleGroups } from "@/lib/modules";
import { getOsceOverallStats } from "@/lib/osce-stats";
import { getUserStats } from "@/lib/teaching-stats";

const ONBOARDING_KEY = "clinicalass_onboarded";
const ONBOARDING_EVENT = "dxflow:onboarding-change";

function subscribeClient() {
  return () => {};
}

function subscribeOnboarding(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(ONBOARDING_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(ONBOARDING_EVENT, notify);
  };
}

export default function DashboardPage() {
  const { session } = useAuth();
  const isClient = useSyncExternalStore(subscribeClient, () => true, () => false);
  const showGuide = useSyncExternalStore(
    subscribeOnboarding,
    () => !localStorage.getItem(ONBOARDING_KEY),
    () => false,
  );

  const savedCount = isClient ? searchLibrary("").length : 0;
  const teachingStats = isClient ? getUserStats() : null;
  const osceStats = isClient ? getOsceOverallStats() : null;
  const questions = teachingStats
    ? Object.values(teachingStats.subjectStats).reduce((total, subject) => total + subject.attempted, 0)
    : 0;

  const dismissGuide = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    window.dispatchEvent(new Event(ONBOARDING_EVENT));
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Overview"
          title={session?.firstName ? `Welcome back, ${session.firstName}` : "Your clinical learning workspace"}
          description="Choose a focused practice format, continue saved work, or review your recent learning activity."
          actions={
            <Link href="/clinical" className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-accent-foreground">
              Start a clinical case <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          }
        />

        {showGuide ? (
          <Surface className="relative border-brand/20 bg-brand-soft/45 p-5 sm:p-6">
            <button type="button" onClick={dismissGuide} className="icon-button absolute right-3 top-3" aria-label="Dismiss getting started guide">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
            <div className="max-w-3xl pr-12">
              <Badge tone="info">Getting started</Badge>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">Build a repeatable practice rhythm</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Start with a structured case, use teaching or OSCE mode for retrieval practice, then review saved work and progress. Generated content remains a learning aid.</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Choose a case", "Clinical reasoning or a full history presentation."],
                ["2", "Practise actively", "Answer, speak, calculate, and commit to a decision."],
                ["3", "Review the output", "Check limitations, sources, and areas to revisit."],
              ].map(([number, title, description]) => (
                <div key={number} className="rounded-[10px] border border-border bg-surface p-4">
                  <span className="font-mono text-xs font-semibold text-brand-strong">{number.padStart(2, "0")}</span>
                  <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
                </div>
              ))}
            </div>
          </Surface>
        ) : null}

        <section aria-labelledby="recommended-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-label">Recommended</p>
              <h2 id="recommended-heading" className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground">Start a focused session</h2>
            </div>
            <span className="hidden text-xs text-muted sm:block">Choose one task and complete the full feedback loop.</span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {modules.filter((module) => module.primary).map((module) => (
              <Link key={module.id} href={module.href} className="group rounded-[14px] border border-border bg-surface p-5 shadow-card transition-colors hover:border-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <div className="flex items-start justify-between">
                  <span className="module-card__icon"><ModuleIcon name={module.icon} className="h-5 w-5" /></span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">{module.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{module.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_320px]" aria-labelledby="all-modules-heading">
          <div className="min-w-0">
            <p className="section-label">All modules</p>
            <h2 id="all-modules-heading" className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground">Everything in one workspace</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {moduleGroups.map((group) => (
                <Surface key={group.id} className="min-w-0 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{group.label}</h3>
                  <div className="mt-2 divide-y divide-border">
                    {modules.filter((module) => module.group === group.id).map((module) => (
                      <Link key={module.id} href={module.href} className="group flex min-h-14 items-center gap-3 rounded-[8px] px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        <ModuleIcon name={module.icon} className="h-[18px] w-[18px] text-brand-strong" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">{module.label}</span>
                          <span className="block truncate text-xs text-muted">{module.description}</span>
                        </span>
                        <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </Surface>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Surface className="p-5">
              <p className="section-label">Your activity</p>
              <dl className="mt-4 space-y-4">
                <Metric icon={BookOpenCheck} label="Teaching questions" value={questions} />
                <Metric icon={Clock3} label="OSCE sessions" value={osceStats?.totalSessions ?? 0} />
                <Metric icon={ShieldCheck} label="Saved items" value={savedCount} />
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link href="/stats" className="inline-flex min-h-11 items-center justify-center rounded-[9px] border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle">Progress</Link>
                <Link href="/library" className="inline-flex min-h-11 items-center justify-center rounded-[9px] border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle">Library</Link>
              </div>
            </Surface>
            <Notice title="Educational use only">
              Do not enter identifiable patient information. Check generated suggestions against current guidance, senior review, and local protocols.
            </Notice>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-surface-subtle text-brand-strong"><Icon aria-hidden="true" className="h-4 w-4" /></span>
      <dt className="min-w-0 flex-1 text-sm text-muted">{label}</dt>
      <dd className="font-mono text-base font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
