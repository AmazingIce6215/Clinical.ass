"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell, GlassCard, PrimaryButton } from "@/components/app-shell";

const ORBS = [
  { className: "left-[4%] top-[4%] w-[16rem] h-[16rem] bg-rose-400/25" },
  { className: "right-[3%] top-[10%] w-[18rem] h-[18rem] bg-amber-400/20" },
  { className: "left-[15%] bottom-[3%] w-[14rem] h-[14rem] bg-pink-400/18" },
  { className: "right-[15%] bottom-[2%] w-[12rem] h-[12rem] bg-orange-400/12" },
];

export default function AboutDeveloperPage() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send");
      }

      setSent(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Orb background (contained inside the page) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-80 blur-3xl">
        {ORBS.map((orb, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${orb.className}`}
            style={{
              animation: `teaching-orb-drift-${i + 1} ${22 + i * 4}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      <AppShell
        backHref="/"
        title="About the Developer"
        subtitle="Built by a med student, for med students"
      >
        <div className="relative z-10 mx-auto max-w-2xl space-y-8">
          {/* Profile section */}
          <GlassCard className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-amber-400/40 bg-surface/90 text-5xl shadow-soft">
              {"🦎"}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hi, I'm Rivindu {"👋"}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                I'm a medical student building this app to make clinical reasoning practice more
                accessible, interactive, and actually enjoyable. I've been working on this as a
                side project to help fellow students sharpen their diagnostic thinking in a more
                practical, hands-on way.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                This is very much a work in progress, so if something feels off or you have an
                idea, I'd love to hear from you. Drop a message below.
              </p>
            </div>
          </GlassCard>

          {/* Message section */}
          <GlassCard className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
                Send me a message
              </p>
              <p className="mt-1.5 text-sm text-muted">
                No sign-up needed. Just type and send — it goes straight to my inbox.
              </p>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey Rivindu! I really like the app, but..."
              rows={4}
              className="w-full resize-none rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
            />

            {error && (
              <p className="text-sm text-rose-500">{error}</p>
            )}

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted">
                {message.length > 0
                  ? `${message.length} character${message.length === 1 ? "" : "s"}`
                  : " "}
              </p>
              <PrimaryButton
                onClick={handleSend}
                disabled={!message.trim() || sending || sent}
              >
                {sending ? "Sending..." : sent ? "Sent! ✅" : "Send message"}
              </PrimaryButton>
            </div>

            {/* Success animation */}
            <AnimatePresence>
              {sent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-4 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                    <span className="text-sm text-emerald-500">{"✓"}</span>
                  </div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
                    Thanks, got it! I'll read your message soon.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="ml-auto text-xs text-muted underline-offset-2 hover:underline"
                  >
                    Send another
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Footer link */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
            >
              {"←"} Back to home
            </Link>
          </div>
        </div>
      </AppShell>
    </>
  );
}