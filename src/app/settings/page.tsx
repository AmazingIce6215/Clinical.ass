"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell, GlassCard, PrimaryButton } from "@/components/app-shell";
import { cn } from "@/lib/utils";

const ACCENT_OPTIONS = [
  { key: "blue", label: "Blue", bg: "bg-blue-500" },
  { key: "teal", label: "Teal", bg: "bg-teal-500" },
  { key: "green", label: "Green", bg: "bg-emerald-500" },
  { key: "purple", label: "Purple", bg: "bg-violet-500" },
  { key: "amber", label: "Amber", bg: "bg-amber-500" },
];

const THEME_OPTIONS = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
];

const getStoredValue = (key: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
};

export default function SettingsPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const persistedName = useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("storage", notify);
      return () => window.removeEventListener("storage", notify);
    },
    () => getStoredValue("clinicalass_username", ""),
    () => "",
  );
  const persistedAccent = useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("storage", notify);
      return () => window.removeEventListener("storage", notify);
    },
    () => getStoredValue("clincalass_accent", "blue"),
    () => "blue",
  );
  const persistedTheme = useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("storage", notify);
      return () => window.removeEventListener("storage", notify);
    },
    () => getStoredValue("clincalass_theme", "system"),
    () => "system",
  );

  const [name, setName] = useState<string>(persistedName);
  const [selectedTheme, setSelectedTheme] = useState<string>(persistedTheme);
  const [accent, setAccent] = useState<string>(persistedAccent);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setTheme(selectedTheme);
  }, [selectedTheme, setTheme]);

  const applyAccent = (accentKey: string) => {
    const accentMap: Record<string, { accent: string; accentForeground: string }> = {
      blue: { accent: "#2563eb", accentForeground: "#ffffff" },
      teal: { accent: "#14b8a6", accentForeground: "#ffffff" },
      green: { accent: "#22c55e", accentForeground: "#ffffff" },
      purple: { accent: "#8b5cf6", accentForeground: "#ffffff" },
      amber: { accent: "#f59e0b", accentForeground: "#0b1220" },
    };

    const values = accentMap[accentKey] ?? accentMap.blue;
    document.documentElement.style.setProperty("--accent", values.accent);
    document.documentElement.style.setProperty(
      "--accent-foreground",
      values.accentForeground,
    );
  };

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  const handleSave = () => {
    localStorage.setItem("clinicalass_username", name);
    localStorage.setItem("clincalass_accent", accent);
    localStorage.setItem("clincalass_theme", selectedTheme);
    setTheme(selectedTheme);
    setShowSuccess(true);
    window.setTimeout(() => router.push("/"), 1300);
  };

  const initial = name ? name.charAt(0).toUpperCase() : "👤";

  return (
    <>
      {/* Success toast overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-surface/80 px-12 py-10 backdrop-blur-xl shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 500, damping: 20 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20"
              >
                <span className="text-3xl text-emerald-500">✓</span>
              </motion.div>
              <p className="text-lg font-semibold text-foreground">Settings saved!</p>
              <p className="text-sm text-muted">Taking you back home...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppShell backHref="/" title="Settings" subtitle="Personalize your profile and appearance">
        <div className="space-y-8">
          <GlassCard className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">Profile</p>
                <p className="mt-2 text-sm text-muted">Update your name and avatar placeholder.</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface/90 text-2xl shadow-soft">
                <span>{initial}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-base outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
              />
              <p className="text-sm text-muted">This value is saved locally and used for greetings.</p>
            </div>
          </GlassCard>

          <GlassCard className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">Appearance</p>
              <p className="mt-2 text-sm text-muted">Control theme and accent preferences for the app shell.</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedTheme(option.key)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                      selectedTheme === option.key
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border/70 bg-surface/70 text-muted hover:border-accent/30 hover:bg-surface/90",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Accent color</p>
                <div className="flex flex-wrap items-center gap-3">
                  {ACCENT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setAccent(option.key)}
                      className={cn(
                        "relative flex h-11 w-11 items-center justify-center rounded-full border transition",
                        option.bg,
                        accent === option.key
                          ? "border-accent-foreground ring-2 ring-accent"
                          : "border-border/60 hover:border-accent/50",
                      )}
                    >
                      {accent === option.key ? (
                        <span className="text-[11px] font-bold text-white">✓</span>
                      ) : null}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted">Saved accent selection is stored locally.</p>
              </div>
            </div>
          </GlassCard>

          <div className="flex justify-end">
            <PrimaryButton onClick={handleSave}>Save settings</PrimaryButton>
          </div>
        </div>
      </AppShell>
    </>
  );
}
