"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { pickDiagnosisLoadingMessage } from "@/lib/diagnosis-loading-messages";

const ROTATE_MS = 7000;

function RotatingDiagnosisMessage({
  patientName,
  complaints,
}: {
  patientName?: string;
  complaints?: string[];
}) {
  const reduceMotion = useReducedMotion();
  const [message, setMessage] = useState(() =>
    pickDiagnosisLoadingMessage({ patientName, complaints }),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessage((current) =>
        pickDiagnosisLoadingMessage({
          patientName,
          complaints,
          exclude: current,
        }),
      );
    }, ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [patientName, complaints]);

  return (
    <div className="min-h-[9rem]">
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl md:text-4xl"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {message}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function DiagnosisLoadingOverlay({
  visible,
  patientName,
  complaints,
}: {
  visible: boolean;
  patientName?: string;
  complaints?: string[];
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 px-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <motion.div
              className="relative mb-10 h-16 w-16"
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 2.4, repeat: Infinity, ease: "linear" }
              }
            >
              <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent" />
              <div className="absolute inset-3 rounded-full bg-accent/10" />
            </motion.div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent/80">
              Generating diagnosis
            </p>

            <RotatingDiagnosisMessage patientName={patientName} complaints={complaints} />

            <motion.p
              className="mt-8 max-w-md text-sm text-muted"
              animate={reduceMotion ? undefined : { opacity: [0.45, 0.9, 0.45] }}
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
              }
            >
              Synthesizing differentials, investigations, and a management plan…
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
