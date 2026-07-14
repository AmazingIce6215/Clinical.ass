import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clinical calculators" };

export default function CalculatorsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
