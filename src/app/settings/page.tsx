"use client";

import { Monitor, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, Notice, PageHeader, Surface } from "@/components/ui/primitives";
import { useAuth } from "@/context/auth-context";
import { updateProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

const themes = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { session, refresh, resetPin } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ tone: "info" | "danger"; title: string; body: string } | null>(null);

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("displayName") || "").trim();
    if (name.length < 2) {
      setMessage({ tone: "danger", title: "Name not saved", body: "Enter at least two characters for your display name." });
      return;
    }

    setSaving(true);
    const result = await updateProfile({ first_name: name });
    setSaving(false);
    if (result.error) {
      setMessage({ tone: "danger", title: "Profile not saved", body: result.error });
      return;
    }
    await refresh();
    setMessage({ tone: "info", title: "Profile updated", body: "Your display name has been saved." });
  };

  const handlePasswordReset = async () => {
    if (!session?.email) {
      setMessage({ tone: "danger", title: "Reset unavailable", body: "This guest or device-local session does not have an email address." });
      return;
    }
    setResetting(true);
    const error = await resetPin(session.email);
    setResetting(false);
    if (error) setMessage({ tone: "danger", title: "Reset request failed", body: error });
    else setMessage({ tone: "info", title: "Check your inbox", body: "A password-reset request has been sent for this account." });
  };

  return (
    <AppShell title="Settings" subtitle="Profile, security, and appearance">
      <div className="mx-auto max-w-4xl space-y-8">
        <PageHeader eyebrow="Account" title="Settings" description="Manage the identity shown in Wardly, request a password reset, and choose a stable display theme." />

        {message ? <Notice title={message.title} tone={message.tone}>{message.body}</Notice> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Surface className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-brand-soft text-brand-strong"><UserRound aria-hidden="true" className="h-5 w-5" /></span>
              <div><h2 className="text-base font-semibold text-foreground">Profile</h2><p className="mt-1 text-sm text-muted">Shown in greetings and learning summaries.</p></div>
            </div>
            <form key={session?.firstName} onSubmit={handleProfileSave} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-foreground">Display name</span>
                <input name="displayName" defaultValue={session?.firstName || ""} autoComplete="name" className="mt-1.5 w-full rounded-[10px] border border-border bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-foreground">Email address</span>
                <input value={session?.email || "Guest session — no email"} readOnly className="mt-1.5 w-full rounded-[10px] border border-border bg-surface-subtle px-3.5 py-3 text-sm text-muted outline-none" />
              </label>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
            </form>
          </Surface>

          <Surface className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-brand-soft text-brand-strong"><ShieldCheck aria-hidden="true" className="h-5 w-5" /></span>
              <div><h2 className="text-base font-semibold text-foreground">Account security</h2><p className="mt-1 text-sm text-muted">Password-reset email is available for hosted accounts. Device-local accounts remain on this installation.</p></div>
            </div>
            <div className="mt-6 rounded-[10px] border border-border bg-surface-subtle p-4 text-sm leading-6 text-muted">
              Saved cases and progress currently remain in this browser or app installation and are not restored by a password reset.
            </div>
            <Button type="button" variant="secondary" className="mt-4" onClick={handlePasswordReset} disabled={resetting || !session?.email}>
              {resetting ? "Requesting…" : "Send password-reset link"}
            </Button>
          </Surface>
        </div>

        <Surface className="p-5 sm:p-6">
          <div><p className="section-label">Appearance</p><h2 className="mt-2 text-lg font-semibold text-foreground">Display theme</h2><p className="mt-1 text-sm text-muted">Wardly uses one fixed clinical palette so status colours and contrast stay consistent.</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Display theme">
            {themes.map((option) => {
              const Icon = option.icon;
              const selected = theme === option.key || (!theme && option.key === "system");
              return (
                <button key={option.key} type="button" role="radio" aria-checked={selected} onClick={() => setTheme(option.key)} className={cn("flex min-h-14 items-center gap-3 rounded-[10px] border px-4 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", selected ? "border-accent bg-brand-soft text-brand-strong" : "border-border bg-surface text-muted hover:bg-surface-subtle")}>
                  <Icon aria-hidden="true" className="h-5 w-5" /> {option.label}
                </button>
              );
            })}
          </div>
        </Surface>
      </div>
    </AppShell>
  );
}
