"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Building your case...",
  "Writing the vignette...",
  "Crafting the question...",
  "Setting up the differentials...",
  "Finalizing the explanation...",
  "Almost ready...",
];

const ORBS = [
  { className: "left-[6%] top-[6%] w-[14rem] h-[14rem] bg-violet-400/35" },
  { className: "right-[4%] top-[12%] w-[16rem] h-[16rem] bg-fuchsia-400/28" },
  { className: "left-[18%] bottom-[4%] w-[15rem] h-[15rem] bg-indigo-400/22" },
  { className: "right-[18%] bottom-[2%] w-[12rem] h-[12rem] bg-pink-400/14" },
];

function RotatingMessage() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-10">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          className="absolute inset-0 flex items-center justify-center text-base font-semibold text-foreground/80"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function TeachingLoadingOverlay({ visible }: { visible: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 px-6 backdrop-blur-md"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          {/* Animated orb blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-90 blur-3xl">
            {ORBS.map((orb, i) => (
              <div
                key={i}
                className={`absolute rounded-full ${orb.className}`}
                style={{
                  animation: `teaching-orb-drift-${i + 1} ${20 + i * 4}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>

          {/* Content card */}
          <div className="relative z-10 mx-auto max-w-md">
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/50 bg-surface/70 p-10 backdrop-blur-xl shadow-2xl">
              {/* Teaching-specific icon */}
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-2 border-violet-400/20"
                  style={reduceMotion ? undefined : { animation: "teaching-loading-spin 2.8s linear infinite" }}
                />
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-400"
                  style={reduceMotion ? undefined : { animation: "teaching-loading-spin 2.8s linear infinite" }}
                />
                <div className="absolute inset-3 rounded-full bg-violet-400/15" />
                <span className="relative text-2xl">📚</span>
              </div>

              {/* Title */}
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-500/80">
                  Teaching session
                </p>
              </div>

              {/* Rotating messages */}
              <RotatingMessage />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}