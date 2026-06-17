"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { PrimaryButton } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";

type Mode = "create" | "unlock";

export function SignInModal() {
  const { create, unlock } = useAuth();
  const [mode, setMode] = useState<Mode>("create");
  const [firstName, setFirstName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err =
      mode === "create"
        ? await create(firstName, pin || undefined)
        : await unlock(firstName, pin || undefined);
    if (err) setError(err);
    setLoading(false);
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
            <span className="text-sm font-bold">Cl</span>
          </div>
          <h2 className="mt-3 text-xl font-semibold">
            {mode === "create" ? "Create a profile" : "Unlock your profile"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Enter your first name to get started.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-muted">First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
              autoComplete="given-name"
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-muted">
              {mode === "create" ? "Optional 4-digit PIN" : "PIN"}
            </span>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder={mode === "create" ? "Skip to leave it empty" : "4 digits"}
              className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm tracking-[0.5em] outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
              autoComplete="off"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading
              ? "Please wait\u2026"
              : mode === "create"
                ? "Create profile"
                : "Unlock"}
          </PrimaryButton>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "create" ? "unlock" : "create");
              setError(null);
              setPin("");
            }}
            className="text-sm text-muted hover:text-accent"
          >
            {mode === "create"
              ? "Already have a profile? Unlock"
              : "New here? Create a profile"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
