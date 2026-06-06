"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NamePromptOverlayProps {
  onSubmit: (name: string) => void;
  onExitComplete?: () => void;
}

export default function NamePromptOverlay({ onSubmit, onExitComplete }: NamePromptOverlayProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError("We'd love to know your name 🙂");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    onSubmit(trimmedName);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onAnimationComplete={(definition) => {
        if (definition === "exit" && onExitComplete) {
          onExitComplete();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="mx-4 max-w-md rounded-2xl bg-surface p-8 shadow-2xl"
      >
        <div className="space-y-6 text-center">
          <div>
            <p className="text-lg font-medium text-muted">Before we begin...</p>
            <p className="mt-2 text-3xl font-semibold">What should we call you?</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <motion.input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Your name..."
                animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="w-full border-b-2 border-border bg-transparent py-3 text-2xl font-medium text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
              />
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-accent"
                initial={{ width: "0%" }}
                animate={{ width: name ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-muted"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-accent px-6 py-3 text-lg font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Continue
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
