import type { Metadata } from "next";

export const metadata: Metadata = { title: "Teaching bank" };

export default function TeachingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
