"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PrimaryButton } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import { checkProfile } from "@/lib/auth";

export function SignInModal() {
  const { create, unlock } = useAuth();
  const [step, setStep] = useState<"name" | "pin">("name");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    await checkProfile(trimmed);
    setStep("pin");
    setLoading(false);
  };

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be 4 digits.");
      return;
    }
    setError(null);
    setLoading(true);

    const exists = (await checkProfile(name)).exists;
    const err = exists
      ? await unlock(name, pin)
      : await create(name, pin);

    if (err) setError(err);
    setLoading(false);
  };

  const goBack = () => {
    setStep("name");
    setPin("");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl border border-border/70 bg-surface/95 p-6 shadow-soft"
      >
        <AnimatePresence mode="wait">
          {step === "name" ? (
            <motion.form
              key="name"
              onSubmit={submitName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold">Hey, what&apos;s your username?</h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your username"
                className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                autoFocus
                required
              />
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-sm text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <PrimaryButton type="submit" disabled={loading} className="w-full">
                {loading ? "..." : "Continue"}
              </PrimaryButton>
            </motion.form>
          ) : (
            <motion.form
              key="pin"
              onSubmit={submitPin}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface/80 hover:text-foreground"
                >
                  ←
                </button>
                <h2 className="text-lg font-semibold">Enter your PIN</h2>
              </div>
              <div className="rounded-xl border border-border/50 bg-surface/50 px-4 py-2.5 text-sm text-muted">
                {name}
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4-digit PIN"
                className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm tracking-[0.5em] outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                autoFocus
                required
              />
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-sm text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <PrimaryButton type="submit" disabled={loading} className="w-full">
                {loading ? "..." : "Go"}
              </PrimaryButton>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
