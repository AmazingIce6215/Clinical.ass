import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandMark } from "@/components/brand-mark";
import { SignInPanel } from "@/components/auth/sign-in-modal";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Orizon or continue with a device-only guest session.",
};

export default function SignInPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <BrandMark href="/" showTagline={false} className="mx-auto mb-8 w-fit" />
        <Suspense fallback={<div className="h-[34rem] animate-pulse rounded-[16px] border border-border bg-surface" aria-label="Loading sign in" />}>
          <SignInPanel />
        </Suspense>
        <p className="mt-6 text-center text-xs leading-5 text-muted">Educational use only · Not for direct patient-care decisions</p>
      </div>
    </main>
  );
}
