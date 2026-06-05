"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const primaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-glow transition disabled:cursor-not-allowed disabled:opacity-50";
const secondaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-surface/60 px-5 py-3 text-sm font-medium backdrop-blur-md transition hover:border-accent/30 disabled:cursor-not-allowed disabled:opacity-50";

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
  const { session, logout } = useAuth();
  const showBack = Boolean(backHref || onBack);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <header className="relative z-20 mb-8 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {showBack ? (
              onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="relative z-30 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-surface/80 backdrop-blur-md transition hover:border-accent/40 hover:bg-surface"
                  aria-label="Go back"
                >
                  <span className="text-lg text-muted">←</span>
                </button>
              ) : (
                <Link
                  href={backHref!}
                  className="relative z-30 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-surface/80 backdrop-blur-md transition hover:border-accent/40 hover:bg-surface"
                  aria-label="Go back"
                >
                  <span className="text-lg text-muted">←</span>
                </Link>
              )
            ) : (
              <Link href="/" className="flex shrink-0 items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-glow">
                  <span className="text-sm font-bold tracking-tight">Cl</span>
                </div>
                <span className="text-lg font-semibold tracking-tight">Clincalass</span>
              </Link>
            )}
            {(title || subtitle) && (
              <div className="hidden min-w-0 sm:block">
                {title && <p className="truncate text-sm font-medium">{title}</p>}
                {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
              </div>
            )}
          </div>
          <div className="relative z-30 flex shrink-0 items-center gap-2">
            {session && pathname !== "/library" && (
              <Link
                href="/library"
                className="rounded-full border border-border/60 bg-surface/70 px-3 py-1.5 text-[11px] font-medium text-muted backdrop-blur-md transition hover:border-accent/40 hover:text-accent"
              >
                Library
              </Link>
            )}
            {session && (
              <button
                type="button"
                onClick={logout}
                className="hidden rounded-full border border-border/60 bg-surface/70 px-3 py-1.5 text-[11px] font-medium text-muted backdrop-blur-md transition hover:text-accent sm:block"
                title={`Signed in as ${session.firstName}`}
              >
                {session.firstName} · Sign out
              </button>
            )}
            <DisclaimerBadge />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function DisclaimerBadge() {
  return (
    <div className="hidden rounded-full border border-border/60 bg-surface/70 px-3 py-1.5 text-[11px] text-muted backdrop-blur-md md:block">
      Educational use only
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
  const Comp = hover ? motion.div : "div";
  const motionProps = hover
    ? {
        whileHover: { y: -4, scale: 1.01 },
        whileTap: { scale: 0.995 },
        transition: { type: "spring" as const, stiffness: 400, damping: 28 },
      }
    : {};

  return (
    <Comp
      className={cn(
        "rounded-2xl border border-border/70 bg-surface/80 p-6 shadow-soft backdrop-blur-xl",
        className,
      )}
      {...motionProps}
    >
      {children}
    </Comp>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(primaryBtnClass, className)}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(secondaryBtnClass, className)}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
    >
      {children}
    </motion.button>
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
    <Link
      href={href}
      className={cn(variant === "primary" ? primaryBtnClass : secondaryBtnClass, className)}
    >
      {children}
    </Link>
  );
}
