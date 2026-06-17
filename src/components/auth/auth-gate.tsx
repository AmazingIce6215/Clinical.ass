"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { OnboardingGuide } from "@/components/onboarding-guide";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!ready) return null;
  if (!session) return <SignInModal />;

  const showGuide =
    !dismissed &&
    typeof window !== "undefined" &&
    !localStorage.getItem("clinicalass_onboarded");

  return (
    <>
      <OnboardingGuide
        open={showGuide}
        userName={session.firstName}
        onClose={() => {
          localStorage.setItem("clinicalass_onboarded", "true");
          setDismissed(true);
        }}
      />
      {children}
    </>
  );
}
