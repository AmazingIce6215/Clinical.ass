"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "Analyzing...",
  "Thinking it through...",
  "Reviewing the clinical picture...",
  "Almost there...",
  "Cross-checking findings...",
  "Putting it together...",
];

const ORBS = [
  { className: "left-[8%] top-[8%] w-[12rem] h-[12rem] bg-blue-400/30" },
  { className: "right-[6%] top-[14%] w-[14rem] h-[14rem] bg-teal-400/25" },
  { className: "left-[20%] bottom-[6%] w-[13rem] h-[13rem] bg-violet-400/20" },
  { className: "right-[20%] bottom-[4%] w-[10rem] h-[10rem] bg-amber-400/12" },
];

const ICONS = ["🧠", "🩺", "💓", "📋", "🔬", "🫀"];

function RotatingMessages() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-8">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeInOut" }}
        >
          {LOADING_MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function RotatingIcon() {
  const reduceMotion = useReducedMotion();
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((i) => (i + 1) % ICONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full border-2 border-accent/15"
        style={reduceMotion ? undefined : { animation: "loading-panel-spin 2.4s linear infinite" }}
      />
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent"
        style={reduceMotion ? undefined : { animation: "loading-panel-spin 2.4s linear infinite" }}
      />
      <div className="absolute inset-3 rounded-full bg-accent/10" />
      <AnimatePresence mode="wait">
        <motion.span
          key={iconIndex}
          className="relative text-xl"
          initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 20 }}
          transition={{ duration: reduceMotion ? 0 : 0.3 }}
        >
          {ICONS[iconIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function LoadingPanel({ visible, fullScreen }: { visible: boolean; fullScreen?: boolean }) {
  const reduceMotion = useReducedMotion();

  const orbLayer = (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-80 blur-3xl">
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${orb.className}`}
          style={{
            animation: `loading-orb-drift-${i + 1} ${18 + i * 4}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );

  const content = (
    <div className="relative z-10 flex flex-col items-center gap-5">
      <RotatingIcon />
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent/70">
          Working on it
        </p>
      </div>
      <RotatingMessages />
    </div>
  );

  if (fullScreen) {
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
            <div className="relative mx-auto flex max-w-lg flex-col items-center overflow-hidden rounded-2xl border border-border/60 bg-surface/80 p-12 backdrop-blur-xl shadow-2xl">
              {orbLayer}
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface/80 p-12 backdrop-blur-xl"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          {orbLayer}
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}