import type { Metadata } from "next";

export const metadata: Metadata = { title: "OSCE practice" };

export default function OsceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
