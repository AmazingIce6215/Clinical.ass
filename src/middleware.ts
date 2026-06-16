import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isMaintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  if (!isMaintenance) return NextResponse.next();

  const { pathname, searchParams, origin } = request.nextUrl;

  const bypassCookie = request.cookies.get("maintenance_bypass")?.value === "true";
  const bypassSecret = process.env.MAINTENANCE_BYPASS_SECRET;
  const bypassParam = searchParams.get("bypass");

  if (bypassSecret && bypassParam === bypassSecret) {
    const cleanUrl = new URL(pathname, origin);
    searchParams.delete("bypass");
    cleanUrl.search = searchParams.toString();
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set("maintenance_bypass", "true", {
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  if (bypassCookie) return NextResponse.next();

  if (
    pathname === "/maintenance" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  const maintenanceUrl = new URL("/maintenance", origin);
  if (bypassSecret) {
    maintenanceUrl.searchParams.set("hint", "set bypass param to bypass");
  }
  return NextResponse.redirect(maintenanceUrl);
}

export const config = {
  matcher: "/((?!_next/static|_next/image).*)",
};
