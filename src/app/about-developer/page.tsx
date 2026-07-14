import type { Metadata } from "next";
import { BookOpenCheck, Code2, ShieldCheck, type LucideIcon } from "lucide-react";
import { FeedbackForm } from "@/components/feedback-form";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "About and feedback",
  description: "Learn how Wardly is maintained and send product feedback without including patient information.",
};

const principles: Array<{ icon: LucideIcon; title: string; description: string }> = [
  { icon: BookOpenCheck, title: "Built for clinical learning", description: "Wardly combines structured encounter tools, case reporting, and formative practice for medical students." },
  { icon: ShieldCheck, title: "Educational scope", description: "Generated content can be wrong and must be checked against authoritative guidance and senior review." },
  { icon: Code2, title: "Maintenance priorities", description: "Feedback helps direct work on reliability, clarity, accessibility, and workflow quality." },
];

export default function AboutDeveloperPage() {
  return (
    <PublicPageShell eyebrow="About the project" title="A medical student-built clinical learning project" description="Wardly is maintained by Rivindu, a medical student building structured tools for supervised clinical learning and practice. It is not affiliated with a university, hospital, professional body, or examination board.">
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4">
          {principles.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-[14px] border border-border bg-surface p-5 shadow-card">
              <Icon aria-hidden="true" className="h-5 w-5 text-brand-strong" />
              <h2 className="mt-4 text-sm font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            </article>
          ))}
        </div>
        <FeedbackForm />
      </div>
    </PublicPageShell>
  );
}
