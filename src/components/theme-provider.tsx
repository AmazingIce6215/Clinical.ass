"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import type { ReactNode } from "react";

function NativeStatusBar() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    async function update() {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        const isDark = resolvedTheme === "dark";
        await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        await StatusBar.setBackgroundColor({
          color: isDark ? "#0b141b" : "#f4f7f9",
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
