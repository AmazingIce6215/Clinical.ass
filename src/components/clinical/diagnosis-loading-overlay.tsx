"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
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
    if (reduceMotion) return;

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
  }, [patientName, complaints, reduceMotion]);

  return (
    <div className="min-h-14">
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          className="text-base font-medium leading-7 text-foreground sm:text-lg"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-atomic="true"
        >
          <div className="mx-auto w-full max-w-xl rounded-xl border border-border bg-surface p-8 text-center shadow-xl sm:p-10">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-accent">
              <LoaderCircle
                className={reduceMotion ? "h-5 w-5" : "h-5 w-5 animate-spin"}
                aria-hidden="true"
              />
            </div>

            <p className="mb-3 text-sm font-semibold text-foreground">
              Generating an educational assessment
            </p>

            <RotatingDiagnosisMessage patientName={patientName} complaints={complaints} />

            <p className="mx-auto mt-5 max-w-md text-xs leading-5 text-muted">
              Generated suggestions can be incomplete. Review the output against the recorded
              findings and appropriate clinical guidance.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
