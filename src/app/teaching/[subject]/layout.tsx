import type { Metadata } from "next";
import { getSubject } from "@/lib/teaching-subjects";

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }): Promise<Metadata> {
  const { subject } = await params;
  const definition = getSubject(subject);
  return { title: definition ? `${definition.name} teaching` : "Teaching bank" };
}

export default function TeachingSubjectLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
