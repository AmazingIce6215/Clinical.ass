import type { Metadata } from "next";

export const metadata: Metadata = { title: "OSCE practice history" };

export default function OsceStatsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
