import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-brand text-sm font-bold text-white">O</span>
            <span className="font-semibold tracking-[-0.025em] text-foreground">Orizon</span>
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-[9px] px-3 text-sm font-semibold text-muted hover:bg-surface-subtle hover:text-foreground">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="max-w-3xl border-b border-border pb-8">
          <p className="section-label">{eyebrow}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-muted">{description}</p>
        </header>
        <div className="mt-8">{children}</div>
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Orizon · Educational use only</p>
          <div className="flex gap-5"><Link href="/privacy-policy" className="hover:text-foreground">Privacy</Link><Link href="/sign-in" className="hover:text-foreground">Sign in</Link></div>
        </div>
      </footer>
    </div>
  );
}
