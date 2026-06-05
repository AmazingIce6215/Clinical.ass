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
  loginUser,
  logoutUser,
  registerUser,
  type AuthSession,
} from "@/lib/auth";
import { setLibraryUserId } from "@/lib/case-library";
import { SignInModal } from "@/components/auth/sign-in-modal";

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  register: (firstName: string, password: string) => Promise<string | null>;
  login: (firstName: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    setLibraryUserId(s?.userId ?? null);
    setReady(true);
  }, []);

  const register = useCallback(async (firstName: string, password: string) => {
    const result = await registerUser(firstName, password);
    if (result.error) return result.error;
    setSession(result.session!);
    setLibraryUserId(result.session!.userId);
    return null;
  }, []);

  const login = useCallback(async (firstName: string, password: string) => {
    const result = await loginUser(firstName, password);
    if (result.error) return result.error;
    setSession(result.session!);
    setLibraryUserId(result.session!.userId);
    return null;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setSession(null);
    setLibraryUserId(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, register, login, logout }),
    [session, ready, register, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {ready && !session && <SignInModal />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
