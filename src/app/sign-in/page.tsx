import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignInPanel } from "@/components/auth/sign-in-modal";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to DxFlow or continue with a device-only guest session.",
};

export default function SignInPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mx-auto mb-8 flex min-h-11 w-fit items-center gap-3 rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-brand text-sm font-bold text-white">Dx</span>
          <span className="font-semibold tracking-[-0.025em] text-foreground">DxFlow</span>
        </Link>
        <Suspense fallback={<div className="h-[34rem] animate-pulse rounded-[16px] border border-border bg-surface" aria-label="Loading sign in" />}>
          <SignInPanel />
        </Suspense>
        <p className="mt-6 text-center text-xs leading-5 text-muted">Educational use only · Not for direct patient-care decisions</p>
      </div>
    </main>
  );
}
