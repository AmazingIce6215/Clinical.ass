import type { Metadata } from "next";

export const metadata: Metadata = { title: "Learning progress" };

export default function StatsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
