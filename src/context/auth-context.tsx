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
  type AuthSession,
} from "@/lib/auth";
import { setLibraryUserId } from "@/lib/case-library";
import { setStatsUserId } from "@/lib/teaching-stats";

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  create: (firstName: string, pin: string) => Promise<string | null>;
  unlock: (firstName: string, pin?: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
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
  }, [session]);

  const create = useCallback(async (firstName: string, pin: string) => {
    const result = await createProfile(firstName, pin);
    if (result.error) return result.error;
    localStorage.removeItem("clinicalass_onboarded");
    setSession(result.session!);
    setLibraryUserId(result.session!.userId);
    setStatsUserId(result.session!.userId);
    return null;
  }, []);

  const unlock = useCallback(async (firstName: string, pin?: string) => {
    const result = await unlockProfile(firstName, pin);
    if (result.error) return result.error;
    setSession(result.session!);
    setLibraryUserId(result.session!.userId);
    setStatsUserId(result.session!.userId);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setSession(null);
    setLibraryUserId(null);
    setStatsUserId(null);
  }, []);

  const refresh = useCallback(async () => {
    const s = await getSession();
    setSession(s);
    setLibraryUserId(s?.userId ?? null);
    setStatsUserId(s?.userId ?? null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, create, unlock, logout, refresh }),
    [session, ready, create, unlock, logout, refresh],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
