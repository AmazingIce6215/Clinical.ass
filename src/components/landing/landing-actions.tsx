"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export function LandingActions({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  const router = useRouter();
  const { session, ready, goAnonymous } = useAuth();

  const enterGuest = () => {
    if (!session) goAnonymous();
    router.push("/dashboard");
  };

  if (compact) {
    return session ? (
      <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-accent-foreground">
        Open workspace <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    ) : (
      <div className="flex items-center gap-2">
        <Link href="/sign-in" className="hidden min-h-11 items-center px-2 text-sm font-semibold text-foreground sm:inline-flex">Sign in</Link>
        <button type="button" onClick={enterGuest} disabled={!ready} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-60">
          Try Wardly <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={enterGuest}
        disabled={!ready}
        className={cn(
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-semibold transition-colors disabled:opacity-60",
          inverted ? "bg-white text-brand hover:bg-white/90" : "bg-accent text-accent-foreground hover:bg-accent/90",
        )}
      >
        {session ? "Open workspace" : "Try as guest"}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
      {!session ? (
        <Link
          href="/sign-in"
          className={cn(
            "inline-flex min-h-12 items-center justify-center rounded-[10px] border px-5 text-sm font-semibold transition-colors",
            inverted ? "border-white/30 text-white hover:bg-white/10" : "border-border bg-surface text-foreground hover:bg-surface-subtle",
          )}
        >
          Sign in or create account
        </Link>
      ) : null}
    </div>
  );
}
