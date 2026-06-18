"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
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

function NativeStatusBar() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    async function update() {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        const isDark = resolvedTheme === "dark";
        await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        await StatusBar.setBackgroundColor({
          color: isDark ? "#070b14" : "#f4f6fb",
        });
      } catch {
        // Not running in Capacitor — ignore
      }
    }
    update();
  }, [resolvedTheme]);

  return null;
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
      <NativeStatusBar />
    </NextThemesProvider>
  );
}
