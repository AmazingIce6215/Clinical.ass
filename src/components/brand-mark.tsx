import Link from "next/link";
import { cn } from "@/lib/utils";

/** Light-mode app mark: purple rounded square with the Orizon symbol. */
export const LOGO_LIGHT_SRC = "/images/logo-light.jpg";
/** Dark-mode app mark: gradient symbol on a dark square. */
export const LOGO_DARK_SRC = "/images/logo-dark.jpg";

export function BrandLogo({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-grid shrink-0", className)} style={{ width: size, height: size }}>
      <img
        src={LOGO_LIGHT_SRC}
        alt=""
        width={size}
        height={size}
        className="col-start-1 row-start-1 h-full w-full rounded-[9px] object-cover dark:hidden"
        aria-hidden="true"
      />
      <img
        src={LOGO_DARK_SRC}
        alt=""
        width={size}
        height={size}
        className="col-start-1 row-start-1 hidden h-full w-full rounded-[9px] object-cover dark:block"
        aria-hidden="true"
      />
    </span>
  );
}

export function BrandMark({
  compact = false,
  href = "/dashboard",
  showTagline = true,
  className,
}: {
  compact?: boolean;
  href?: string;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-3 rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
      aria-label={href === "/" ? "Orizon home" : "Orizon dashboard"}
    >
      <BrandLogo />
      {!compact ? (
        showTagline ? (
          <span>
            <span className="block text-[15px] font-semibold tracking-[-0.02em] text-foreground">
              Orizon
            </span>
            <span className="block text-[11px] text-muted">Clinical toolkit for students</span>
          </span>
        ) : (
          <span className="text-base font-semibold tracking-[-0.025em] text-foreground">Orizon</span>
        )
      ) : null}
    </Link>
  );
}
