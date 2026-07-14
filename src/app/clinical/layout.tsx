import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clinical reasoning" };

export default function ClinicalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
