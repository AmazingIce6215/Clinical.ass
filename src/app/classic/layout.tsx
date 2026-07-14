import type { Metadata } from "next";

export const metadata: Metadata = { title: "Case report" };

export default function ClassicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
