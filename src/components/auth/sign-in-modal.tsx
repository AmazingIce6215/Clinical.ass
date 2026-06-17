"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PrimaryButton } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import { checkProfile, getProfileCreatedAt } from "@/lib/auth";

function ErrorBox({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-600"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const cardClass = "w-full max-w-sm rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-soft sm:p-6";
const stepTransition = { duration: 0.18, ease: "easeOut" as const };

export function SignInModal() {
  const { create, unlock, resetPin, goAnonymous } = useAuth();
  const [step, setStep] = useState<"role" | "name" | "pin" | "forgot" | "reset-pin" | "anonymous">("role");
  const [isNew, setIsNew] = useState(true);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotAttempts, setForgotAttempts] = useState(0);
  const [forgotDate, setForgotDate] = useState("");

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    setError(null);

    if (!isNew) {
      setLoading(true);
      const profile = await checkProfile(trimmed);
      setLoading(false);
      if (!profile.exists) {
        setError("No profile found with that username.");
        return;
      }
    }

    setStep("pin");
  };

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be 4 digits.");
      return;
    }
    setError(null);
    setLoading(true);

    const err = isNew ? await create(name, pin) : await unlock(name, pin);

    if (err) setError(err);
    setLoading(false);
  };

  const submitForgotDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotDate) {
      setError("Please enter a date.");
      return;
    }
    setError(null);
    setLoading(true);

    const createdAt = await getProfileCreatedAt(name);
    setLoading(false);

    if (!createdAt) {
      setError("Could not verify account. Try again later.");
      return;
    }

    const expected = createdAt.slice(0, 10);
    if (forgotDate !== expected) {
      setForgotAttempts((p) => p + 1);
      setError("That doesn\u2019t match our records.");
      return;
    }

    setStep("reset-pin");
    setForgotDate("");
  };

  const submitNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be 4 digits.");
      return;
    }
    setError(null);
    setLoading(true);

    const err = await resetPin(name, pin);

    if (err) setError(err);
    setLoading(false);
  };

  const goBack = () => {
    setStep("name");
    setPin("");
    setForgotDate("");
    setError(null);
  };

  const goToPin = () => {
    setStep("pin");
    setPin("");
    setForgotDate("");
    setError(null);
  };

  const goToRole = () => {
    setStep("role");
    setName("");
    setPin("");
    setForgotDate("");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-4">
      <AnimatePresence mode="wait">
        {step === "role" ? (
          <motion.div
            key="role"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex w-full max-w-2xl flex-col items-center justify-center gap-2"
          >
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Welcome to Clinical.ass
            </motion.h1>
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
              <motion.button
                type="button"
                onClick={() => { setIsNew(true); setStep("name"); }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-[220px] rounded-2xl border border-border/60 bg-surface/70 px-6 py-6 text-center text-base font-medium shadow-sm backdrop-blur-md transition hover:border-accent/40 hover:bg-accent/5 hover:shadow-md sm:py-8"
              >
                <div className="text-xl sm:text-2xl">{"\u2728"}</div>
                <div className="mt-2">I&apos;m a new user</div>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => { setIsNew(false); setStep("name"); }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-[220px] rounded-2xl border border-border/60 bg-surface/70 px-6 py-6 text-center text-base font-medium shadow-sm backdrop-blur-md transition hover:border-accent/40 hover:bg-accent/5 hover:shadow-md sm:py-8"
              >
                <div className="text-2xl">{"\u21A9\uFE0F"}</div>
                <div className="mt-2">I&apos;m a returning user</div>
              </motion.button>
            </div>
            <motion.button
              type="button"
              onClick={() => setStep("anonymous")}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.35, ease: "easeOut" }}
              className="mt-6 text-sm text-muted underline underline-offset-2 transition hover:text-foreground"
            >
              Skip, stay anonymous
            </motion.button>
          </motion.div>
        ) : step === "anonymous" ? (
          <motion.div
            key="anonymous"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={stepTransition}
            className={cardClass}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("role")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface/80 hover:text-foreground"
              >
                {"\u2190"}
              </button>
              <h2 className="text-xl font-semibold">Stay anonymous</h2>
            </div>
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-relaxed text-muted">
              <p className="mb-2 font-medium text-foreground">Local only — no cloud sync</p>
              <p>
                Staying anonymous means everything stays{" "}
                <strong>on this device</strong> — your cases, stats, and activity live in
                your browser&apos;s local storage and never leave.
              </p>
              <p className="mt-3">
                If you want your data synced so it follows you across devices, go back and
                create a username with a PIN instead.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              <PrimaryButton type="button" onClick={goAnonymous} className="w-full">
                Stay local
              </PrimaryButton>
            </div>
          </motion.div>
        ) : step === "name" ? (
          <motion.form
            key="name"
            onSubmit={submitName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={stepTransition}
            className={cardClass}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToRole}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface/80 hover:text-foreground"
              >
                {"\u2190"}
              </button>
              <div className="space-y-0.5">
                {isNew ? (
                  <>
                    <p className="text-sm text-muted">Before we begin,&nbsp;give us</p>
                    <h2 className="text-xl font-semibold">What&apos;s your username?</h2>
                  </>
                ) : (
                  <h2 className="text-xl font-semibold">Enter your username</h2>
                )}
              </div>
            </div>
            <div className="mt-5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your username"
                className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                autoFocus
                required
              />
            </div>
            <div className="mt-5 space-y-4">
              <ErrorBox message={error} />
              <PrimaryButton type="submit" disabled={loading} className="w-full">
                {loading ? "..." : "Continue"}
              </PrimaryButton>
            </div>
          </motion.form>
        ) : step === "pin" ? (
          <motion.form
            key="pin"
            onSubmit={submitPin}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={stepTransition}
            className={cardClass}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goBack}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface/80 hover:text-foreground"
              >
                {"\u2190"}
              </button>
              <div>
                <p className="text-sm text-muted">{isNew ? "Create a new PIN" : "Enter your PIN"}</p>
                <p className="text-xs text-muted/60">{name}</p>
              </div>
            </div>
            <div className="mt-5">
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
            </div>
            <div className="mt-5 space-y-3">
              <ErrorBox message={error} />
              <PrimaryButton type="submit" disabled={loading} className="w-full">
                {loading ? "..." : "Go"}
              </PrimaryButton>
              {!isNew && forgotAttempts < 3 && (
                <button
                  type="button"
                  onClick={() => setStep("forgot")}
                  className="w-full text-center text-xs text-muted underline underline-offset-2 transition hover:text-foreground"
                >
                  Forgot PIN?
                </button>
              )}
            </div>
          </motion.form>
        ) : step === "forgot" ? (
          <motion.form
            key="forgot"
            onSubmit={submitForgotDate}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={stepTransition}
            className={cardClass}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPin}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface/80 hover:text-foreground"
              >
                {"\u2190"}
              </button>
              <div className="space-y-0.5">
                <p className="text-sm text-muted">Account recovery</p>
                <h2 className="text-xl font-semibold">When was it created?</h2>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <p className="text-xs text-muted">
                What date was this account created? Think back to when you first joined.
              </p>
              <input
                type="date"
                value={forgotDate}
                onChange={(e) => setForgotDate(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                autoFocus
                required
              />
            </div>
            <div className="mt-5 space-y-4">
              <ErrorBox message={error} />
              <PrimaryButton type="submit" disabled={loading} className="w-full">
                {loading ? "..." : "Verify"}
              </PrimaryButton>
            </div>
          </motion.form>
        ) : (
          <motion.form
            key="reset-pin"
            onSubmit={submitNewPin}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={stepTransition}
            className={cardClass}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPin}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface/80 hover:text-foreground"
              >
                {"\u2190"}
              </button>
              <div>
                <p className="text-sm text-muted">Account recovery</p>
                <p className="text-xs text-muted/60">{name}</p>
              </div>
            </div>
            <div className="mt-5 space-y-1">
              <h2 className="text-lg font-semibold">Create a new PIN</h2>
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
            </div>
            <div className="mt-5 space-y-4">
              <ErrorBox message={error} />
              <PrimaryButton type="submit" disabled={loading} className="w-full">
                {loading ? "..." : "Set PIN"}
              </PrimaryButton>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
