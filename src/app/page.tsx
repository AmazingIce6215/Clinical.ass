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

const primaryModules = modules.filter((module) => module.featured);
const supportingModules = modules.filter(
  (module) => module.id !== "library" && module.id !== "stats" && !module.featured,
);

const primaryHighlights: Record<string, string[]> = {
  clinical: ["Structured patient findings", "Working differential", "Reasoning review"],
  "image-diagnosis": ["Validated image upload", "De-identification reminder", "Clearly labelled AI output"],
};

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Wardly home">
            <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-brand text-sm font-bold text-white">W</span>
            <span className="text-base font-semibold tracking-[-0.025em] text-foreground">Wardly</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Public navigation">
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#how-it-works" className="hover:text-foreground">Capabilities</a>
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
                <ShieldCheck aria-hidden="true" className="h-4 w-4" /> AI-assisted clinical toolkit for medical students
              </div>
              <h1 className="mt-6 max-w-[13ch] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-foreground sm:text-6xl">
                A clearer way to reason through clinical encounters.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                Structure patient findings, build a focused differential, review clinical images, prepare case reports, and strengthen the thinking behind every presentation.
              </p>
              <div className="mt-8">
                <LandingActions />
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">
                Educational use only. Designed for supervised clinical learning—not diagnosis or autonomous decision-making. Never enter identifiable patient information.
              </p>
            </div>

            <ProductSpecimen />
          </div>
        </section>

        <section id="modules" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="section-label">Core clinical tools</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
              Think clearly. See more. Present with confidence.
            </h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Start with structured clinical reasoning or image diagnosis, then use focused tools for case reporting, calculations, practice, and review.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {primaryModules.map((module, index) => (
              <article key={module.id} className="relative overflow-hidden rounded-[18px] border border-brand/20 bg-surface p-6 shadow-panel sm:p-7">
                <div className="absolute inset-x-0 top-0 h-1 bg-brand" aria-hidden="true" />
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-brand text-white">
                    <ModuleIcon name={module.icon} className="h-6 w-6" />
                  </span>
                  <span className="rounded-full border border-border bg-surface-subtle px-3 py-1 text-[11px] font-semibold text-brand-strong">
                    {index === 0 ? "Reasoning workspace" : "Visual review"}
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-foreground">{module.label}</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{module.description}</p>
                <ul className="mt-6 grid gap-2 sm:grid-cols-3" aria-label={`${module.label} capabilities`}>
                  {(primaryHighlights[module.id] ?? []).map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-success" /> {highlight}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">More tools and learning modes</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {supportingModules.map((module) => (
                <article key={module.id} className="rounded-[14px] border border-border bg-surface p-5 shadow-card">
                  <span className="module-card__icon"><ModuleIcon name={module.icon} className="h-5 w-5" /></span>
                  <h3 className="mt-5 text-base font-semibold text-foreground">{module.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{module.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-20">
            <div>
              <p className="section-label">Clinical learning, structured</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                Built around the work that matters.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Reason through findings", "Structure history, examination, and investigations while keeping recorded facts distinct from generated suggestions."],
                ["Interpret clinical images", "Review de-identified images through validated uploads, transparent processing, and clearly labelled AI output."],
                ["Report and practise", "Prepare a structured case report, rehearse OSCE interviews, and reinforce knowledge with targeted teaching cases."],
              ].map(([title, description]) => (
                <article key={title} className="border-l-2 border-brand-soft pl-4">
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                </article>
              ))}
            </div>
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
                Wardly is a learning tool. AI-generated material can be incomplete or wrong and should always be checked against current guidance, local protocols, and senior clinical judgement.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TrustPoint icon={ShieldCheck} title="Educational scope">Not intended for emergencies, diagnosis, or direct patient-care decisions.</TrustPoint>
              <TrustPoint icon={Database} title="Data clarity">Saved cases and learning progress remain device-local in the current product.</TrustPoint>
              <TrustPoint icon={LockKeyhole} title="Provider disclosure">AI requests pass through Wardly server routes to configured model providers.</TrustPoint>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-brand text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.035em]">Bring structure to the next clinical encounter.</h2>
              <p className="mt-2 text-sm text-white/75">Reason through findings, review an image, or prepare a clear case report in one focused workspace.</p>
            </div>
            <LandingActions inverted />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Wardly. Educational use only.</p>
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
    <div className="rounded-[18px] border border-border bg-background p-3 shadow-panel" aria-label="Wardly clinical case interface preview">
      <div className="rounded-[14px] border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Clinical reasoning</p>
            <p className="mt-0.5 text-[11px] text-muted">Patient facts and AI review, clearly separated</p>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-strong">Encounter</span>
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
