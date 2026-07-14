"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Notice } from "@/components/ui/primitives";
import { useAuth } from "@/context/auth-context";
import { normalizeAuthResult } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup" | "reset";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export function SignInPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, ready, create, unlock, resetPin, goAnonymous } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const next = safeNext(searchParams.get("next"));

  useEffect(() => {
    if (ready && session) router.replace(next);
  }, [next, ready, router, session]);

  const chooseMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
    setPassword("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "reset") {
      if (!email.trim()) {
        setError("Enter the email address linked to your account.");
        return;
      }
      setLoading(true);
      const resetError = await resetPin(email);
      setLoading(false);
      if (resetError) setError(resetError);
      else setSuccess("If an account exists for this email, a reset link has been sent.");
      return;
    }

    if (mode === "signup" && firstName.trim().length < 2) {
      setError("Enter the name you would like DxFlow to display.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Complete both the email and password fields.");
      return;
    }
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    const result = mode === "signup"
      ? await create(firstName, email, password)
      : await unlock(email, password);
    setLoading(false);

    if (result) {
      const message = normalizeAuthResult(result);
      if (mode === "signup" && /check your inbox|confirm/i.test(message)) setSuccess(message);
      else setError(message);
      return;
    }

    router.replace(next);
  };

  const continueAsGuest = () => {
    goAnonymous();
    router.replace(next);
  };

  return (
    <div className="rounded-[16px] border border-border bg-surface p-5 shadow-panel sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-brand-strong">
          <UserRoundCheck aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="section-label">Secure access</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-foreground">
            {mode === "signin" ? "Sign in to DxFlow" : mode === "signup" ? "Create your account" : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {mode === "signup"
              ? "An account stores your profile and session. Saved cases and learning statistics currently remain on this device."
              : mode === "reset"
                ? "We will request a password-reset email for a hosted account. Device-local accounts cannot receive reset email."
                : "Continue to your clinical tools, saved work, and device-local progress."}
          </p>
        </div>
      </div>

      {mode !== "reset" ? (
        <div className="mt-6 grid grid-cols-2 rounded-[10px] border border-border bg-surface-subtle p-1" role="group" aria-label="Authentication mode">
          <button type="button" onClick={() => chooseMode("signin")} aria-pressed={mode === "signin"} className={cn("min-h-10 rounded-[8px] text-sm font-semibold", mode === "signin" ? "bg-surface text-foreground shadow-card" : "text-muted")}>Sign in</button>
          <button type="button" onClick={() => chooseMode("signup")} aria-pressed={mode === "signup"} className={cn("min-h-10 rounded-[8px] text-sm font-semibold", mode === "signup" ? "bg-surface text-foreground shadow-card" : "text-muted")}>Create account</button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" ? (
          <label className="block">
            <span className="text-sm font-semibold text-foreground">Display name</span>
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="name" placeholder="Your name" className="mt-1.5 w-full rounded-[10px] border border-border bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15" />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-semibold text-foreground">Email address</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className="mt-1.5 w-full rounded-[10px] border border-border bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15" />
        </label>

        {mode !== "reset" ? (
          <label className="block">
            <span className="text-sm font-semibold text-foreground">Password</span>
            <span className="relative mt-1.5 block">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="At least 6 characters" className="w-full rounded-[10px] border border-border bg-surface px-3.5 py-3 pr-12 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
              </button>
            </span>
          </label>
        ) : null}

        {error ? <Notice title="We could not complete that request" tone="danger">{error}</Notice> : null}
        {success ? <Notice title="Check your inbox">{success}</Notice> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        {mode === "reset" ? (
          <button type="button" onClick={() => chooseMode("signin")} className="font-semibold text-brand-strong hover:underline">Back to sign in</button>
        ) : (
          <button type="button" onClick={() => chooseMode("reset")} className="text-muted hover:text-foreground">Forgot password?</button>
        )}
        <button type="button" onClick={continueAsGuest} className="font-semibold text-brand-strong hover:underline">Continue as guest</button>
      </div>

      <div className="mt-6 flex gap-3 rounded-[10px] border border-border bg-surface-subtle p-3 text-xs leading-5 text-muted">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
        <p>Do not enter identifiable patient information. Review the <Link href="/privacy-policy" className="font-semibold text-foreground underline underline-offset-2">privacy policy</Link> before using AI-assisted modules.</p>
      </div>
    </div>
  );
}

// Compatibility export for any legacy imports while routes migrate away from a modal gate.
export function SignInModal() {
  return <SignInPanel />;
}
