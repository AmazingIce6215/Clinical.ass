"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell, GlassCard, PrimaryButton } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { updateProfile } from "@/lib/auth";

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

export default function SettingsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { setTheme } = useTheme();

  const [name, setName] = useState(session?.firstName ?? "");
  const [pin, setPin] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem("clincalass_theme") || "system";
  });
  const [accent, setAccent] = useState(() => {
    if (typeof window === "undefined") return "blue";
    return localStorage.getItem("clincalass_accent") || "blue";
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.firstName) setName(session.firstName);
  }, [session?.firstName]);

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
    document.documentElement.style.setProperty("--accent-foreground", values.accentForeground);
  };

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  const handleSave = async () => {
    setError(null);

    const result = await updateProfile({ first_name: name, pin: pin || undefined });
    if (result.error) {
      setError(result.error);
      return;
    }

    localStorage.setItem("clincalass_accent", accent);
    localStorage.setItem("clincalass_theme", selectedTheme);
    setTheme(selectedTheme);
    setShowSuccess(true);
    window.setTimeout(() => router.push("/"), 1300);
  };

  const initial = name ? name.charAt(0).toUpperCase() : "👤";

  return (
    <>
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
                <p className="mt-2 text-sm text-muted">Update your username and PIN.</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface/90 text-2xl shadow-soft">
                <span>{initial}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Username</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your username"
                className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-base outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4-digit PIN"
                className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-base tracking-[0.5em] outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
              />
              <p className="text-sm text-muted">Leave blank to keep your current PIN.</p>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </GlassCard>

          <GlassCard className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">Appearance</p>
              <p className="mt-2 text-sm text-muted">Control theme and accent preferences.</p>
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
