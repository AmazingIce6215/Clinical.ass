"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { OnboardingGuide } from "@/components/onboarding-guide";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (session && ready) {
      const onboarded = typeof window !== "undefined" && localStorage.getItem("clinicalass_onboarded");
      if (!onboarded) setShowGuide(true);
    }
  }, [session, ready]);

  if (!ready) return null;
  if (!session) return <SignInModal />;

  return (
    <>
      <OnboardingGuide
        open={showGuide}
        userName={session.firstName}
        onClose={() => {
          localStorage.setItem("clinicalass_onboarded", "true");
          setShowGuide(false);
        }}
      />
      {children}
    </>
  );
}
