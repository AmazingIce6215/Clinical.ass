"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "Validating the available information…",
  "Reviewing the relevant findings…",
  "Structuring the educational response…",
] as const;

function RotatingMessages({ messages }: { messages: readonly string[] }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || messages.length < 2) return;

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 3_500);

    return () => window.clearInterval(interval);
  }, [messages.length, reduceMotion]);

  return (
    <div className="relative h-7 w-full max-w-sm">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          className="absolute inset-0 flex items-center justify-center text-center text-sm text-muted"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function LoadingContent() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-accent">
        <LoaderCircle
          className={reduceMotion ? "h-5 w-5" : "h-5 w-5 animate-spin"}
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Preparing response</p>
        <p className="mt-1 text-xs text-muted">Keep this page open while processing completes.</p>
      </div>
      <RotatingMessages messages={LOADING_MESSAGES} />
    </div>
  );
}

export function LoadingPanel({
  visible,
  fullScreen,
}: {
  visible: boolean;
  fullScreen?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (fullScreen) {
    return (
      <AnimatePresence>
        {visible ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 px-6"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-atomic="true"
          >
            <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-xl sm:p-10">
              <LoadingContent />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.15 }}
          className="rounded-xl bg-surface p-8 sm:p-10"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-atomic="true"
        >
          <LoadingContent />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
