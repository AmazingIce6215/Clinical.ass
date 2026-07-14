"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getModuleByPath, moduleGroups, modules } from "@/lib/modules";
import { ModuleIcon } from "@/components/ui/icons";
import { useAuth } from "@/context/auth-context";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const buttonStyles = {
  primary: "bg-accent text-accent-foreground hover:bg-accent/90",
  secondary:
    "border border-border bg-surface text-foreground hover:border-accent/30 hover:bg-surface-subtle",
};

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="inline-flex min-h-11 items-center gap-3 rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="DxFlow dashboard"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-brand text-sm font-bold tracking-[-0.04em] text-white">
        Dx
      </span>
      {!compact ? (
        <span>
          <span className="block text-[15px] font-semibold tracking-[-0.02em] text-foreground">
            DxFlow
          </span>
          <span className="block text-[11px] text-muted">Clinical toolkit for students</span>
        </span>
      ) : null}
    </Link>
  );
}

function NavLink({
  href,
  label,
  icon,
  leading,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon?: Parameters<typeof ModuleIcon>[0]["name"];
  leading?: ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "bg-brand-soft text-brand-strong"
          : "text-muted hover:bg-surface-subtle hover:text-foreground",
      )}
    >
      {leading ?? (icon ? <ModuleIcon name={icon} className="h-[18px] w-[18px]" /> : <LayoutDashboard aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />)}
      <span>{label}</span>
    </Link>
  );
}

function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { session, logout } = useAuth();
  const displayName = session?.firstName?.trim() || "Guest learner";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    window.location.replace("/");
  };

  return (
    <details className="group relative">
      <summary
        className={cn(
          "flex min-h-11 cursor-pointer list-none items-center rounded-[10px] border border-border bg-surface transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden",
          compact ? "w-11 justify-center" : "w-full gap-3 px-3",
        )}
        aria-label="Open account menu"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
          {initial}
        </span>
        {!compact ? (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold text-foreground">{displayName}</span>
              <span className="block truncate text-[11px] text-muted">
                {session?.email || "Device-only session"}
              </span>
            </span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
          </>
        ) : null}
      </summary>
      <div
        className={cn(
          "absolute right-0 z-50 w-60 rounded-[12px] border border-border bg-surface p-1.5 shadow-panel",
          compact ? "top-[calc(100%+0.5rem)]" : "bottom-[calc(100%+0.5rem)]",
        )}
      >
        <Link href="/settings" className="menu-item">
          <Settings aria-hidden="true" className="h-4 w-4" /> Settings
        </Link>
        <Link href="/privacy-policy" className="menu-item">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" /> Privacy
        </Link>
        <Link href="/about-developer" className="menu-item">
          <CircleHelp aria-hidden="true" className="h-4 w-4" /> Help and feedback
        </Link>
        <button type="button" onClick={handleLogout} className="menu-item w-full text-left">
          <LogOut aria-hidden="true" className="h-4 w-4" /> Sign out
        </button>
      </div>
    </details>
  );
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="px-5 py-5">
        <BrandMark />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Workspace navigation">
        <NavLink href="/dashboard" label="Overview" active={pathname === "/dashboard"} />
        {moduleGroups.map((group) => {
          const items = modules.filter((module) => module.group === group.id);
          return (
            <div key={group.id} className="mt-6">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                {group.label}
              </p>
              <div className="mt-1.5 space-y-0.5">
                {items.map((module) => (
                  <NavLink
                    key={module.id}
                    href={module.href}
                    label={module.label}
                    icon={module.icon}
                    active={pathname === module.href || pathname.startsWith(`${module.href}/`)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        <div className="mt-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Account</p>
          <div className="mt-1.5 space-y-0.5">
            <NavLink href="/settings" label="Settings" active={pathname === "/settings"} leading={<Settings aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />} />
            <NavLink href="/privacy-policy" label="Privacy" active={pathname === "/privacy-policy"} leading={<ShieldCheck aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />} />
            <NavLink href="/about-developer" label="Help and feedback" active={pathname === "/about-developer"} leading={<CircleHelp aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />} />
          </div>
        </div>
      </nav>
      <div className="border-t border-border p-3">
        <AccountMenu />
      </div>
    </aside>
  );
}

function MobileNavigation({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const primary = modules.filter((module) => module.mobilePrimary);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const panel = closeButtonRef.current?.closest("[data-navigation-panel]");
      const focusable = panel?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), summary, [tabindex]:not([tabindex='-1'])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-border bg-surface px-4 pt-safe lg:hidden">
        <BrandMark />
        <div className="flex items-center gap-2">
          <AccountMenu compact />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="icon-button"
            aria-label="Open navigation"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface px-2 pb-safe lg:hidden" aria-label="Primary navigation">
        <MobileTab href="/dashboard" label="Overview" active={pathname === "/dashboard"}>
          <LayoutDashboard aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </MobileTab>
        {primary.map((module) => (
          <MobileTab
            key={module.id}
            href={module.href}
            label={module.shortLabel}
            active={pathname === module.href || pathname.startsWith(`${module.href}/`)}
          >
            <ModuleIcon name={module.icon} className="h-5 w-5" />
          </MobileTab>
        ))}
        <button
          type="button"
          className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-[8px] text-[11px] font-medium text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => setOpen(true)}
          aria-expanded={open}
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
          More
        </button>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Workspace navigation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
          <div data-navigation-panel className="absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col border-l border-border bg-surface shadow-panel">
            <div className="flex min-h-16 items-center justify-between border-b border-border px-4 pt-safe">
              <BrandMark />
              <button ref={closeButtonRef} type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close navigation">
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="All modules">
              <NavLink href="/dashboard" label="Overview" active={pathname === "/dashboard"} onClick={() => setOpen(false)} />
              {moduleGroups.map((group) => (
                <div key={group.id} className="mt-5">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{group.label}</p>
                  <div className="mt-1.5 space-y-0.5">
                    {modules.filter((module) => module.group === group.id).map((module) => (
                      <NavLink
                        key={module.id}
                        href={module.href}
                        label={module.label}
                        icon={module.icon}
                        active={pathname === module.href || pathname.startsWith(`${module.href}/`)}
                        onClick={() => setOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-5">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Account</p>
                <div className="mt-1.5 space-y-0.5">
                  <NavLink href="/settings" label="Settings" active={pathname === "/settings"} onClick={() => setOpen(false)} leading={<Settings aria-hidden="true" className="h-[18px] w-[18px]" />} />
                  <NavLink href="/privacy-policy" label="Privacy" active={pathname === "/privacy-policy"} onClick={() => setOpen(false)} leading={<ShieldCheck aria-hidden="true" className="h-[18px] w-[18px]" />} />
                  <NavLink href="/about-developer" label="Help and feedback" active={pathname === "/about-developer"} onClick={() => setOpen(false)} leading={<CircleHelp aria-hidden="true" className="h-[18px] w-[18px]" />} />
                </div>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MobileTab({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-16 flex-col items-center justify-center gap-1 rounded-[8px] text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active ? "text-brand-strong" : "text-muted",
      )}
    >
      {children}
      {label}
    </Link>
  );
}

function WorkspaceLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6" role="status" aria-live="polite">
      <div className="w-full max-w-sm rounded-[14px] border border-border bg-surface p-6 text-center shadow-card">
        <div className="mx-auto h-9 w-9 animate-pulse rounded-[9px] bg-brand-soft" />
        <p className="mt-4 text-sm font-medium text-foreground">Opening your workspace</p>
        <p className="mt-1 text-xs text-muted">Checking your session on this device.</p>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  backHref,
  onBack,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready } = useAuth();
  const activeModule = useMemo(() => getModuleByPath(pathname), [pathname]);

  useEffect(() => {
    if (!ready || session) return;
    const next = pathname.startsWith("/") ? pathname : "/dashboard";
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
  }, [pathname, ready, router, session]);

  if (!ready || !session) return <WorkspaceLoading />;

  const shellTitle = title || activeModule?.label || "Workspace";
  const showBack = Boolean(backHref || onBack);

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <DesktopSidebar pathname={pathname} />
      <div className="min-w-0 flex-1">
        <MobileNavigation pathname={pathname} />
        <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">
          {(showBack || title || subtitle) ? (
            <div className="mb-6 flex min-h-11 items-center gap-3 border-b border-border pb-4">
              {showBack ? (
                onBack ? (
                  <button type="button" onClick={onBack} className="icon-button" aria-label="Go back">
                    <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                  </button>
                ) : (
                  <Link href={backHref!} className="icon-button" aria-label="Go back">
                    <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                  </Link>
                )
              ) : null}
              <div className="min-w-0">
                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
                  <Link href="/dashboard" className="shrink-0 hover:text-foreground">Overview</Link>
                  {activeModule ? (
                    <>
                      <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      {shellTitle !== activeModule.label ? (
                        <>
                          <Link href={activeModule.href} className="max-w-40 truncate hover:text-foreground">{activeModule.label}</Link>
                          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                        </>
                      ) : null}
                      <span aria-current="page" className="truncate font-medium text-foreground">{shellTitle}</span>
                    </>
                  ) : shellTitle !== "Workspace" ? (
                    <>
                      <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      <span aria-current="page" className="truncate font-medium text-foreground">{shellTitle}</span>
                    </>
                  ) : null}
                </nav>
                {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
              </div>
            </div>
          ) : null}
          <main id="main-content" className="min-w-0 flex-1" tabIndex={-1}>
            {children}
          </main>
          <footer className="mt-10 border-t border-border pt-4 text-xs leading-5 text-muted">
            DxFlow supports supervised clinical learning and formative practice. It is not a substitute for clinical judgement, senior review, or local protocols.
          </footer>
        </div>
      </div>
    </div>
  );
}

export function GlassCard({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn("surface-card", hover && "surface-card--interactive", className)}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(buttonBase, buttonStyles.primary, className)} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(buttonBase, buttonStyles.secondary, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "secondary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonBase, buttonStyles[variant], className)}>
      {children}
    </Link>
  );
}
