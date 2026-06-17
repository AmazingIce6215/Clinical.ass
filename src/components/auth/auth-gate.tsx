"use client";

import { useAuth } from "@/context/auth-context";
import { SignInModal } from "@/components/auth/sign-in-modal";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();

  if (!ready) return null;
  if (!session) return <SignInModal />;
  return <>{children}</>;
}
