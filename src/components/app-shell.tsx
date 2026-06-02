"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  backHref,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  backHref?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {backHref ? (
              <Link
                href={backHref}
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-surface/80 backdrop-blur-md transition hover:border-accent/40 hover:bg-surface"
                aria-label="Go back"
              >
                <motion.span
                  className="text-lg text-muted"
                  whileHover={{ x: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  ←
                </motion.span>
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-glow">
                  <span className="text-sm font-bold tracking-tight">Dx</span>
                </div>
                <span className="text-lg font-semibold tracking-tight">DxFlow</span>
              </Link>
            )}
            {(title || subtitle) && (
              <div className="hidden sm:block">
                {title && <p className="text-sm font-medium">{title}</p>}
                {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
              </div>
            )}
          </div>
          <DisclaimerBadge />
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
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-glow transition disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
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
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-surface/60 px-5 py-3 text-sm font-medium backdrop-blur-md transition hover:border-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
    >
      {children}
    </motion.button>
  );
}
