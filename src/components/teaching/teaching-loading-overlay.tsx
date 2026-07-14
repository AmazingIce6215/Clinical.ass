"use client";

import { BookOpenCheck, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Surface } from "@/components/ui/primitives";

const messages = [
  "Generating the clinical vignettes",
  "Preparing the answer options",
  "Writing formative explanations",
  "Checking the session structure",
];

function LoadingMessage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, []);

  return <p className="mt-2 text-sm leading-6 text-muted">{messages[index]}</p>;
}

export function TeachingLoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Preparing generated teaching session"
    >
      <Surface className="w-full max-w-md p-6 text-center sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] border border-border bg-surface-subtle text-accent">
          <BookOpenCheck aria-hidden="true" className="h-6 w-6" />
        </span>
        <div className="mt-5 flex items-center justify-center gap-2">
          <LoaderCircle
            aria-hidden="true"
            className="h-4 w-4 animate-spin text-accent motion-reduce:animate-none"
          />
          <p className="font-semibold text-foreground">Preparing teaching session</p>
        </div>
        <LoadingMessage />
        <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">
          Generated educational content should be checked against current clinical guidance.
        </p>
      </Surface>
    </div>
  );
}
