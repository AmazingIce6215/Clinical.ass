"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PrimaryButton } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";

function MessageBox({ message, tone }: { message: string | null; tone: "error" | "success" }) {
  if (!message) return null;

  const toneClass = tone === "error"
    ? "border-red-500/20 bg-red-500/10 text-red-600"
    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={`rounded-xl border px-4 py-2.5 text-sm ${toneClass}`}
    >
      {message}
    </motion.div>
  );
}

const cardClass = "w-full max-w-md rounded-[28px] border border-border/70 bg-surface/95 p-5 shadow-soft sm:p-7";

export function SignInModal() {
  const { create, unlock, resetPin, goAnonymous } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "reset") {
      if (!email.trim()) {
        setError("Please enter your email.");
        return;
      }
      setLoading(true);
      const err = await resetPin(email);
      setLoading(false);
      if (err) {
        setError(err);
      } else {
        setSuccess("A reset link has been sent to your inbox.");
      }
      return;
    }

    if (mode === "signup" && firstName.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Please complete both email and password fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const err = mode === "signup"
      ? await create(firstName, email, password)
      : await unlock(email, password);
    setLoading(false);

    if (err) {
      setError(err);
    } else if (mode === "signup") {
      setSuccess("Welcome aboard. Your account is ready.");
    }
  };

  const resetForm = () => {
    setError(null);
    setSuccess(null);
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cardClass}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-accent">Clinical.ass</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
            </h2>
          </div>
          <div className="rounded-2xl bg-accent/10 px-3 py-2 text-2xl">🩺</div>
        </div>

        <p className="mb-5 text-sm leading-6 text-muted">
          {mode === "signin"
            ? "Sign in to continue your clinical learning journey with your saved progress."
            : mode === "signup"
              ? "Create a secure account and keep your learning synced across devices."
              : "We will send a secure reset link to your email."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="mb-1.5 block text-sm font-medium">Your name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full rounded-xl border border-border/80 bg-surface/70 px-4 py-3 text-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border/80 bg-surface/70 px-4 py-3 text-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
              autoComplete="email"
            />
          </div>

          {mode !== "reset" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-border/80 bg-surface/70 px-4 py-3 pr-20 text-sm outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted transition hover:text-foreground"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {error && <MessageBox key="error" message={error} tone="error" />}
            {success && <MessageBox key="success" message={success} tone="success" />}
          </AnimatePresence>

          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </PrimaryButton>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              resetForm();
            }}
            className="transition hover:text-foreground"
          >
            {mode === "signin" ? "Create account" : "Sign in instead"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("reset");
              resetForm();
            }}
            className="transition hover:text-foreground"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            goAnonymous();
          }}
          className="mt-4 w-full text-sm text-muted underline underline-offset-2 transition hover:text-foreground"
        >
          Continue anonymously
        </button>
      </motion.div>
    </div>
  );
}
