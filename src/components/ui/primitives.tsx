import Link from "next/link";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const buttonVariants = {
  primary: "bg-accent text-accent-foreground hover:bg-accent/90",
  secondary:
    "border border-border bg-surface text-foreground hover:border-accent/35 hover:bg-surface-subtle",
  ghost: "text-muted hover:bg-surface-subtle hover:text-foreground",
  danger:
    "border border-danger/30 bg-danger-soft text-danger hover:border-danger/45 hover:bg-danger-soft/80",
};

export type ButtonVariant = keyof typeof buttonVariants;

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  variant = "secondary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonBase, buttonVariants[variant], className)}>
      {children}
    </Link>
  );
}

export function Surface({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[14px] border border-border bg-surface shadow-card", className)}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "border-border bg-surface-subtle text-muted",
    info: "border-info/25 bg-info-soft text-info",
    success: "border-success/25 bg-success-soft text-success",
    warning: "border-warning/30 bg-warning-soft text-warning",
    danger: "border-danger/25 bg-danger-soft text-danger",
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Notice({
  title,
  children,
  tone = "info",
  className,
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    info: "border-info/25 bg-info-soft",
    warning: "border-warning/30 bg-warning-soft",
    danger: "border-danger/25 bg-danger-soft",
  };

  return (
    <aside className={cn("rounded-[12px] border p-4", tones[tone], className)}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-1 text-sm leading-6 text-muted">{children}</div>
    </aside>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Surface className="px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </Surface>
  );
}
