"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getSession,
  logoutUser,
  createProfile,
  unlockProfile,
  resetPin as resetPinFn,
  createAnonymousSession,
  type AuthSession,
} from "@/lib/auth";
import { setLibraryUserId } from "@/lib/case-library";
import { setStatsUserId } from "@/lib/teaching-stats";
import { setOsceStatsUserId } from "@/lib/osce-stats";

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  create: (firstName: string, email: string, password: string) => Promise<string | null>;
  unlock: (email: string, password: string) => Promise<string | null>;
  resetPin: (email: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  goAnonymous: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSession().then((s) => {
      setSession(s);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    setLibraryUserId(session?.userId ?? null);
    setStatsUserId(session?.userId ?? null);
    setOsceStatsUserId(session?.userId ?? null);
  }, [session]);

  const create = useCallback(async (firstName: string, email: string, password: string) => {
    const result = await createProfile(firstName, email, password);
    if (result.error) return result.error;
    localStorage.removeItem("clinicalass_onboarded");
    setSession(result.session!);
    setLibraryUserId(result.session!.userId);
    setStatsUserId(result.session!.userId);
    setOsceStatsUserId(result.session!.userId);
    return null;
  }, []);

  const unlock = useCallback(async (email: string, password: string) => {
    const result = await unlockProfile(email, password);
    if (result.error) return result.error;
    setSession(result.session!);
    setLibraryUserId(result.session!.userId);
    setStatsUserId(result.session!.userId);
    setOsceStatsUserId(result.session!.userId);
    return null;
  }, []);

  const goAnonymous = useCallback(() => {
    const s = createAnonymousSession();
    setSession(s);
    setLibraryUserId(s.userId);
    setStatsUserId(s.userId);
    setOsceStatsUserId(s.userId);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setSession(null);
    setLibraryUserId(null);
    setStatsUserId(null);
    setOsceStatsUserId(null);
  }, []);

  const refresh = useCallback(async () => {
    const s = await getSession();
    setSession(s);
    setLibraryUserId(s?.userId ?? null);
    setStatsUserId(s?.userId ?? null);
    setOsceStatsUserId(s?.userId ?? null);
  }, []);

  const resetPin = useCallback(async (email: string) => {
    const result = await resetPinFn(email);
    if (result.error) return result.error;
    return null;
  }, []);

  const value = useMemo(
    () => ({ session, ready, create, unlock, resetPin, logout, refresh, goAnonymous }),
    [session, ready, create, unlock, resetPin, logout, refresh, goAnonymous],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
