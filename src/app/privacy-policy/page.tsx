"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/app-shell";

export default function PrivacyPolicyPage() {
  return (
    <AppShell>
      <div className="relative min-h-[calc(100dvh-6rem)] overflow-hidden">
        {/* Same blurred orb background as home page */}
        <div className="homepage-orbs" aria-hidden="true">
          <span className="homepage-orb homepage-orb--one" />
          <span className="homepage-orb homepage-orb--two" />
          <span className="homepage-orb homepage-orb--three" />
          <span className="homepage-orb homepage-orb--four" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              What happens with your data?
            </p>
          </div>

          <div className="space-y-8">
            {/* Your Name */}
            <GlassCard className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Your Name</h2>
              <p className="text-muted leading-relaxed">
                When you first visit, you can enter a name or stay anonymous. This is stored only in your browser&apos;s local storage. It never leaves your device and is never sent to any server.
              </p>
            </GlassCard>

            {/* Chat Messages and Images */}
            <GlassCard className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Chat Messages and Images</h2>
              <p className="text-muted leading-relaxed">
                Anything you type or upload in Companion, Classic, Teaching, Image Diagnosis, or OSCE Examiner mode is sent directly to Groq or Google Gemini&apos;s APIs to generate a response. These messages are not stored on any server, and the developer does not have access to them.
              </p>
            </GlassCard>

            {/* Saved Cases (Library) */}
            <GlassCard className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Saved Cases (Library)</h2>
              <p className="text-muted leading-relaxed">
                When you save a case from Companion, Classic, or Teaching mode, it is stored entirely in your browser&apos;s local storage. Saved cases never leave your device and can be deleted at any time from the Library page or by resetting your data.
              </p>
            </GlassCard>

            {/* Usage Statistics */}
            <GlassCard className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Usage Statistics</h2>
              <p className="text-muted leading-relaxed">
                The app tracks basic usage metrics (sessions completed, cases worked through, streaks) stored locally in your browser. This data is not sent to any server and is used only to show you your progress on the Stats page.
              </p>
            </GlassCard>

            {/* Feedback Messages */}
            <GlassCard className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Feedback Messages</h2>
              <p className="text-muted leading-relaxed">
                Messages sent through &apos;Meet the Developer&apos; are emailed directly to the developer via Resend.
              </p>
            </GlassCard>

            {/* Third-Party Providers */}
            <GlassCard className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Third-Party Providers</h2>
              <p className="text-muted leading-relaxed">
                Since messages and images are processed by Groq and Google Gemini, their respective privacy policies also apply to data sent through this app. All clinical calculators run entirely in your browser with no data sent to any external service.
                <br />
                <a href="https://groq.com/privacy-policy/" className="text-accent underline hover:text-accent/80" target="_blank" rel="noopener noreferrer">
                  https://groq.com/privacy-policy/
                </a>
                <br />
                <a href="https://policies.google.com/privacy" className="text-accent underline hover:text-accent/80" target="_blank" rel="noopener noreferrer">
                  https://policies.google.com/privacy
                </a>
                <br />
                <a href="https://resend.com/legal/privacy-policy" className="text-accent underline hover:text-accent/80" target="_blank" rel="noopener noreferrer">
                  https://resend.com/legal/privacy-policy
                </a>
              </p>
            </GlassCard>

            {/* Local Storage */}
            <GlassCard className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Your Data, Your Control</h2>
              <p className="text-muted leading-relaxed">
                All your data is stored locally in your browser. You can clear it anytime by tapping your avatar and selecting <span className="font-medium text-foreground">Reset everything</span>. No account data, personal information, or usage history is retained on any server.
              </p>
            </GlassCard>

            {/* Changes */}
            <GlassCard className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Changes to This Policy</h2>
              <p className="text-muted leading-relaxed">
                If this policy changes materially, the app will be updated with a new version. Since the app does not collect user contact information, changes take effect immediately upon updating.
              </p>
            </GlassCard>

            {/* Questions */}
            <GlassCard className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Questions</h2>
              <p className="text-muted leading-relaxed">
                If you have any concerns, tap your avatar and use <span className="font-medium text-foreground">Meet the Developer</span> to get in touch.
              </p>
            </GlassCard>
          </div>

          {/* Back to homepage link */}
          <div className="mt-12 flex justify-center">
            <Link href="/" className="text-sm text-muted hover:text-accent">
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}