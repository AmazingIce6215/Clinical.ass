"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { PrimaryButton } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import { checkProfile } from "@/lib/auth";

export function SignInModal() {
  const { create, unlock } = useAuth();
  const [step, setStep] = useState<"name" | "pin">("name");
  const [firstName, setFirstName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(false);

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = firstName.trim();
    if (name.length < 2) {
      setError("Enter your name (at least 2 letters).");
      return;
    }
    setError(null);
    setLoading(true);

    const profile = await checkProfile(name);
    setExisting(profile.exists);

    if (profile.exists && !profile.hasPin) {
      const err = await unlock(name);
      if (err) setError(err);
    } else {
      setStep("pin");
    }
    setLoading(false);
  };

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const err = existing
      ? await unlock(firstName, pin || undefined)
      : await create(firstName, pin || undefined);

    if (err) setError(err);
    setLoading(false);
  };

  const reset = () => {
    setStep("name");
    setPin("");
    setError(null);
    setExisting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border/70 bg-surface/95 p-8 shadow-soft backdrop-blur-xl"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-glow">
            <span className="text-lg font-bold">Cl</span>
          </div>

          {step === "name" ? (
            <>
              <h2 className="mt-3 text-xl font-semibold">Hey, what should we call you?</h2>
              <p className="mt-2 text-sm text-muted">
                Your name is used for your profile and personalized greetings.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-xl font-semibold">
                {existing ? "Welcome back" : "Nice to meet you"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {existing
                  ? "Enter your PIN to unlock."
                  : "Add a 4-digit PIN or skip to leave it open."}
              </p>
            </>
          )}
        </div>

        {step === "name" ? (
          <form onSubmit={submitName} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-muted">Your name</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Rivindu"
                className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                autoComplete="given-name"
                autoFocus
                required
              />
            </label>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <PrimaryButton type="submit" disabled={loading} className="w-full">
              {loading ? "Checking\u2026" : "Continue"}
            </PrimaryButton>
          </form>
        ) : (
          <form onSubmit={submitPin} className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-surface/50 px-4 py-3 text-sm">
              <span className="text-muted">Name: </span>
              <span className="font-medium">{firstName}</span>
              <button
                type="button"
                onClick={reset}
                className="ml-2 text-accent hover:underline"
              >
                Change
              </button>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-muted">
                {existing ? "PIN" : "Optional 4-digit PIN"}
              </span>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={existing ? "Enter your PIN" : "4 digits or leave blank"}
                className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm tracking-[0.5em] outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                autoComplete="off"
                autoFocus
              />
            </label>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <PrimaryButton type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait\u2026" : existing ? "Unlock" : "Create profile"}
            </PrimaryButton>
          </form>
        )}
      </motion.div>
    </div>
  );
}
