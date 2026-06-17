"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PrimaryButton } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import { checkProfile } from "@/lib/auth";

function ErrorBox({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-600"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-5"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="space-y-1"
              >
                <p className="text-sm text-muted">Before we begin,&nbsp;tell&nbsp;us</p>
                <h2 className="text-xl font-semibold">What&apos;s your username?</h2>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your username"
                  className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                  autoFocus
                  required
                />
              </motion.div>
              <ErrorBox message={error} />
              <PrimaryButton type="submit" disabled={loading} className="w-full">
                {loading ? "..." : "Continue"}
              </PrimaryButton>
            </motion.form>
          ) : (
            <motion.form
              key="pin"
              onSubmit={submitPin}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-5"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface/80 hover:text-foreground"
                >
                  ←
                </button>
                <div>
                  <p className="text-sm text-muted">Enter your PIN</p>
                  <p className="text-xs text-muted/60">{name}</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
              >
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="4-digit PIN"
                  className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none transition placeholder:text-muted/30 placeholder:text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                  autoFocus
                  required
                />
              </motion.div>
              <ErrorBox message={error} />
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
