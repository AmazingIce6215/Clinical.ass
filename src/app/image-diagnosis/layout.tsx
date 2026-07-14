import type { Metadata } from "next";

export const metadata: Metadata = { title: "Image analysis" };

export default function ImageAnalysisLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
