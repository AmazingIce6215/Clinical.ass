"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const primaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-glow transition duration-300 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-surface/65 px-5 py-3 text-sm font-medium shadow-sm backdrop-blur-md transition duration-300 hover:border-accent/35 disabled:cursor-not-allowed disabled:opacity-50";

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
  const { session } = useAuth();
  const showBack = Boolean(backHref || onBack);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-90" />
      <div className="app-shell-grid pointer-events-none absolute inset-0 opacity-35" />
      <span className="app-shell-orb app-shell-orb--one" aria-hidden="true" />
      <span className="app-shell-orb app-shell-orb--two" aria-hidden="true" />
      <span className="app-shell-orb app-shell-orb--three" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <header className="relative z-20 mb-6 flex flex-col gap-4 border-b border-border/40 pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {showBack ? (
              onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-surface/80 text-lg text-muted shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
                  aria-label="Go back"
                >
                  ←
                </button>
              ) : (
                <Link
                  href={backHref!}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-surface/80 text-lg text-muted shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:text-accent"
                  aria-label="Go back"
                >
                  ←
                </Link>
              )
            ) : (
              <Link href="/" className="group flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-surface/80 text-base font-bold text-accent shadow-sm backdrop-blur-md transition duration-300 group-hover:-translate-y-0.5">
                  C
                </div>
                <div className="min-w-0">
                  <p className="shell-heading truncate text-sm font-semibold">Clinical.ass</p>
                  <p className="shell-subtle truncate text-xs">Precision clinical reasoning workspace</p>
                </div>
              </Link>
            )}

            {(title || subtitle) && (
              <div className="min-w-0">
                {title && <p className="shell-heading truncate text-base font-semibold sm:text-lg">{title}</p>}
                {subtitle && <p className="shell-subtle truncate text-xs sm:text-sm">{subtitle}</p>}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {session && pathname !== "/library" && (
              <Link href="/library" className="ui-pill hover:border-accent/30 hover:text-foreground">
                Library
              </Link>
            )}
            {session && pathname !== "/stats" && (
              <Link href="/stats" className="ui-pill hover:border-accent/30 hover:text-foreground">
                Stats
              </Link>
            )}
            {session && pathname !== "/settings" && (
              <Link href="/settings" className="ui-pill hover:border-accent/30 hover:text-foreground">
                Settings
              </Link>
            )}
          </div>
        </header>

        {children}
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
        "glass-card rounded-[1.5rem] p-6",
        hover && "transition-transform duration-300",
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
