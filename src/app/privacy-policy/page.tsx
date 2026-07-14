import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Orizon handles account details, device-local learning data, AI requests, uploads, and feedback.",
};

const sections = [
  {
    title: "Account and profile information",
    body: "When hosted authentication is enabled, email/password authentication and basic profile information are processed and stored by Supabase. When hosted authentication is not enabled, Orizon uses a device-local account fallback. A guest session does not require an email address.",
  },
  {
    title: "Saved cases and learning progress",
    body: "The current library, teaching statistics, OSCE history, calculator favourites, theme preference, and onboarding state are stored in this browser or app installation. They are scoped using existing local storage keys and are not currently synchronised between devices.",
  },
  {
    title: "Clinical text and generated cases",
    body: "Information entered into Clinical, Classic, Teaching, and OSCE modules is sent through Orizon server routes to configured AI providers, including Groq or Google Gemini, to generate a response. Orizon does not intentionally persist these request bodies in an application database, but infrastructure and model providers may process operational logs under their own policies.",
  },
  {
    title: "Uploaded images",
    body: "Images submitted for educational analysis pass through an Orizon server route to Google Gemini. Do not upload names, identifiers, faces, labels, or other information that could identify a patient. Uploaded images are not added to the Orizon case library by the application.",
  },
  {
    title: "Clinical calculators",
    body: "Calculator inputs and calculations run in the browser. Calculator favourites are stored on the device. Scores remain educational aids and must be interpreted using current guidance, the stated population, limitations, and local protocols.",
  },
  {
    title: "Feedback",
    body: "Messages submitted through the feedback form are sent to the project maintainer through Resend. Do not include patient information, passwords, access keys, or other sensitive data in a feedback message.",
  },
  {
    title: "Your controls",
    body: "You can remove individual saved cases, clear the library, sign out, or clear the application’s local storage through your browser or device settings. Deleting browser data does not automatically delete a hosted account; contact the maintainer through the feedback channel to ask about account deletion.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell eyebrow="Privacy" title="How Orizon handles your data" description="This policy describes the current implementation. It separates account data, device-local learning data, and information sent to third-party model providers.">
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[14px] border border-border bg-surface p-5 shadow-card">
            <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{section.body}</p>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-[14px] border border-border bg-surface p-5 shadow-card">
        <h2 className="text-base font-semibold text-foreground">Third-party policies</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Provider terms and retention practices can change. Review the current policies before submitting sensitive educational material.</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-brand-strong">
          <a href="https://groq.com/privacy-policy/" target="_blank" rel="noreferrer" className="underline underline-offset-2">Groq privacy</a>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2">Google privacy</a>
          <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2">Supabase privacy</a>
          <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="underline underline-offset-2">Resend privacy</a>
        </div>
      </section>
      <p className="mt-6 text-xs leading-5 text-muted">Last updated: 14 July 2026. Questions can be sent through the <Link href="/about-developer" className="font-semibold text-foreground underline underline-offset-2">feedback page</Link>.</p>
    </PublicPageShell>
  );
}
