import Link from "next/link";
import {
  ArrowRight,
  Check,
  Database,
  LockKeyhole,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { LandingActions } from "@/components/landing/landing-actions";
import { ModuleIcon } from "@/components/ui/icons";
import { modules } from "@/lib/modules";

const featuredModules = modules.filter((module) => module.id !== "library" && module.id !== "stats");

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="DxFlow home">
            <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-brand text-sm font-bold text-white">Dx</span>
            <span className="text-base font-semibold tracking-[-0.025em] text-foreground">DxFlow</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Public navigation">
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#how-it-works" className="hover:text-foreground">Use cases</a>
            <a href="#safety" className="hover:text-foreground">Safety</a>
            <Link href="/privacy-policy" className="hover:text-foreground">Privacy</Link>
          </nav>
          <LandingActions compact />
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-surface">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)] lg:items-center lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border bg-surface-subtle px-3 text-xs font-semibold text-brand-strong">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" /> Built for medical students in clinical training
              </div>
              <h1 className="mt-6 max-w-[13ch] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-foreground sm:text-6xl">
                Clinical tools for the patient encounter—and the learning around it.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                DxFlow gives medical students independent tools for organizing patient findings, preparing case presentations, practising OSCEs, revising with generated questions, reviewing de-identified images, and using common clinical scores.
              </p>
              <div className="mt-8">
                <LandingActions />
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">
                Educational use only. Use patient-encounter tools under appropriate supervision and never enter identifiable patient information.
              </p>
            </div>

            <ProductSpecimen />
          </div>
        </section>

        <section id="modules" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="section-label">Independent tools, organized by purpose</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
              Use the right mode for the job.
            </h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Each module stands on its own. There is no required sequence and DxFlow does not assume that work in one mode continues into another.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredModules.map((module) => (
              <article key={module.id} className="rounded-[14px] border border-border bg-surface p-5 shadow-card">
                <span className="module-card__icon"><ModuleIcon name={module.icon} className="h-5 w-5" /></span>
                <h3 className="mt-5 text-base font-semibold text-foreground">{module.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-20">
            <div>
              <p className="section-label">Different contexts</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                No fixed flow. Choose by context.
              </h2>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "During a supervised encounter", "Use Clinical reasoning to organize de-identified findings, or Case presentation to prepare a structured summary for review."],
                ["02", "For deliberate practice", "Teaching and OSCE are separate practice modes for questions, patient interviews, and formative feedback."],
                ["03", "When a standalone aid fits", "Open a calculator or image analysis directly. These tools do not depend on completing another module first."],
              ].map(([number, title, description]) => (
                <li key={number} className="border-l-2 border-brand-soft pl-4">
                  <span className="font-mono text-xs font-semibold text-brand-strong">{number}</span>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="safety" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="section-label">Trust through transparency</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                Clear about what the product can—and cannot—do.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                DxFlow is a learning tool. AI-generated material can be incomplete or wrong and should always be checked against current guidance, local protocols, and senior clinical judgement.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TrustPoint icon={ShieldCheck} title="Educational scope">Not intended for emergencies, diagnosis, or direct patient-care decisions.</TrustPoint>
              <TrustPoint icon={Database} title="Data clarity">Saved cases and learning progress remain device-local in the current product.</TrustPoint>
              <TrustPoint icon={LockKeyhole} title="Provider disclosure">AI requests pass through DxFlow server routes to configured model providers.</TrustPoint>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-brand text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.035em]">Open the tool that fits the moment.</h2>
              <p className="mt-2 text-sm text-white/75">Start as a guest and choose any module. No fixed workflow is required.</p>
            </div>
            <LandingActions inverted />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} DxFlow. Educational use only.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/privacy-policy" className="hover:text-foreground">Privacy</Link>
            <Link href="/about-developer" className="hover:text-foreground">Help and feedback</Link>
            <Link href="/sign-in" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductSpecimen() {
  const steps = ["Presenting concern", "Focused history", "Examination", "Differential"];
  return (
    <div className="rounded-[18px] border border-border bg-background p-3 shadow-panel" aria-label="DxFlow clinical case interface preview">
      <div className="rounded-[14px] border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Clinical reasoning tool</p>
            <p className="mt-0.5 text-[11px] text-muted">De-identified encounter notes · Supervised use</p>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-strong">In progress</span>
        </div>
        <div className="grid sm:grid-cols-[150px_1fr]">
          <div className="border-b border-border p-3 sm:border-b-0 sm:border-r">
            <ol className="space-y-1">
              {steps.map((step, index) => (
                <li key={step} className={`flex min-h-9 items-center gap-2 rounded-[8px] px-2 text-[11px] font-medium ${index === 1 ? "bg-brand-soft text-brand-strong" : "text-muted"}`}>
                  <span className={`grid h-5 w-5 place-items-center rounded-full border ${index === 0 ? "border-success bg-success-soft text-success" : index === 1 ? "border-brand text-brand-strong" : "border-border"}`}>
                    {index === 0 ? <Check aria-hidden="true" className="h-3 w-3" /> : index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="p-5">
            <p className="section-label">Focused history</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">Clarify the symptom pattern</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Record the onset, character, associated symptoms, and relevant risk factors before reviewing generated suggestions.</p>
            <div className="mt-5 grid gap-2">
              {["Onset and progression", "Associated symptoms", "Relevant medical history"].map((label) => (
                <div key={label} className="flex min-h-10 items-center justify-between rounded-[9px] border border-border px-3 text-xs text-foreground">
                  {label}<ArrowRight aria-hidden="true" className="h-4 w-4 text-muted" />
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[10px] border border-info/25 bg-info-soft p-3">
              <p className="text-xs font-semibold text-foreground">AI-assisted review</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">Generated suggestions remain separate from entered patient facts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustPoint({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-[14px] border border-border bg-surface p-5 shadow-card">
      <Icon aria-hidden="true" className="h-5 w-5 text-brand-strong" strokeWidth={1.8} />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{children}</p>
    </article>
  );
}
