"use client";

import { motion } from "framer-motion";
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

  if (step === "name") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-2xl border border-border/70 bg-surface/95 p-6 shadow-soft"
        >
          <form onSubmit={submitName} className="space-y-4">
              <h2 className="text-lg font-semibold">Hey, tell us your username</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Username"
              className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
              autoFocus
              required
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <PrimaryButton type="submit" disabled={loading} className="w-full">
              {loading ? "..." : "Continue"}
            </PrimaryButton>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-border/70 bg-surface/95 p-6 shadow-soft"
      >
        <form onSubmit={submitPin} className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>{name}</span>
            <button type="button" onClick={goBack} className="text-accent hover:underline">
              Change
            </button>
          </div>
          <h2 className="text-lg font-semibold">Enter your PIN</h2>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4-digit PIN"
            className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm tracking-[0.5em] outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
            autoFocus
            required
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "..." : "Go"}
          </PrimaryButton>
        </form>
      </motion.div>
    </div>
  );
}
