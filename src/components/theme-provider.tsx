"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";
import type { ReactNode } from "react";

const ACCENT_MAP: Record<
  string,
  { accent: string; accentForeground: string }
> = {
  blue: { accent: "#2563eb", accentForeground: "#ffffff" },
  teal: { accent: "#14b8a6", accentForeground: "#ffffff" },
  green: { accent: "#22c55e", accentForeground: "#ffffff" },
  purple: { accent: "#8b5cf6", accentForeground: "#ffffff" },
  amber: { accent: "#f59e0b", accentForeground: "#0b1220" },
};

function applyAccentColor(key: string) {
  if (typeof document === "undefined") return;
  const values = ACCENT_MAP[key] ?? ACCENT_MAP.blue;
  document.documentElement.style.setProperty("--accent", values.accent);
  document.documentElement.style.setProperty(
    "--accent-foreground",
    values.accentForeground,
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateAccent = () => {
      const stored = localStorage.getItem("clincalass_accent") || "blue";
      applyAccentColor(stored);
    };

    updateAccent();
    window.addEventListener("storage", updateAccent);
    return () => window.removeEventListener("storage", updateAccent);
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
