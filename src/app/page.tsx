"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell, GlassCard } from "@/components/app-shell";
import NamePromptOverlay from "@/components/name-prompt-overlay";

const modes = [
  {
    href: "/clinical",
    title: "Clincalass Companion",
    description:
      "Real-life workup: triage, targeted HPI, exam, investigations → diagnosis, differentials & management.",
    icon: "🩺",
    accent: "from-blue-500/20 to-cyan-500/10",
  },
  {
    href: "/classic",
    title: "Classic Mode",
    description:
      "Full ward-round history taking — build a structured case presentation for your consultant.",
    icon: "📋",
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    href: "/teaching",
    title: "Teaching Mode",
    description:
      "Case-based Q-bank with 3 unique patient vignettes per session, MCQs, and detailed explanations.",
    icon: "📚",
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
];

export default function HomePage() {
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("clincalass_username") || "";
  });
  const [greeting, setGreeting] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [homepageVisible, setHomepageVisible] = useState(false);

  const fetchGreeting = useCallback(
    async (name?: string) => {
      try {
        const timestamp = Date.now();
        const query = name ? `&name=${encodeURIComponent(name)}` : "";
        const url = `/api/greeting?_=${timestamp}${query}`;
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();
        const newGreeting = data.greeting;
        setGreeting(newGreeting);
        sessionStorage.setItem("aiGreeting", newGreeting);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch greeting:", error);
        setGreeting("HELLO DOCTOR");
        setIsLoading(false);
      }
    },
    [],
  );

  const handleNameSubmit = (name: string) => {
    localStorage.setItem("clincalass_username", name);
    setUserName(name);
    setShowNamePrompt(false);
    // Reset animation state so animations play when entering name for first time
    sessionStorage.removeItem("homepageAnimated");
    setHasAnimated(false);
    // Fetch greeting for the current user
    fetchGreeting(name);
    // Show homepage after overlay exit animation completes (500ms)
    setTimeout(() => {
      setHomepageVisible(true);
    }, 500);
  };

  useEffect(() => {
    // Check localStorage for user name
    const savedName = localStorage.getItem("clincalass_username");
    if (savedName) {
      // Fetch greeting for the saved name
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchGreeting(savedName);
      // Small delay before showing homepage for returning users
      setTimeout(() => {
        setHomepageVisible(true);
      }, 200);
    } else {
      // Show name prompt on first visit
      setShowNamePrompt(true);
    }

    // Check for animation preference
    const hasSeenAnimation = sessionStorage.getItem("homepageAnimated");
    if (hasSeenAnimation) {
      setHasAnimated(true);
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    const greetingTimer = window.setInterval(() => {
      const currentName = localStorage.getItem("clincalass_username");
      if (currentName) {
        fetchGreeting(currentName);
      }
    }, 10 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const currentName = localStorage.getItem("clincalass_username");
        if (currentName) {
          fetchGreeting(currentName);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.clearInterval(greetingTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchGreeting]);

  const shouldAnimate = !hasAnimated && !prefersReducedMotion && homepageVisible;

  // Mark animation as seen after it plays
  useEffect(() => {
    if (homepageVisible && shouldAnimate) {
      const timer = setTimeout(() => {
        sessionStorage.setItem("homepageAnimated", "true");
        setHasAnimated(true);
      }, 4000); // After all animations complete (~4s total)

      return () => clearTimeout(timer);
    }
  }, [homepageVisible, shouldAnimate]);

  return (
    <AppShell>
      <AnimatePresence>
        {showNamePrompt && (
          <NamePromptOverlay onSubmit={handleNameSubmit} />
        )}
      </AnimatePresence>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: homepageVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto flex max-w-4xl flex-1 flex-col justify-center py-8"
      >
        <div className="mb-12 text-center">
          {/* Logo icon */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/10 text-5xl shadow-inner text-muted"
          >
            <span>🩺</span>
          </motion.div>

          <div className="mx-auto max-w-3xl text-center">
            {/* 1. Greeting fade-in (0s-1s) */}
            {isLoading ? (
              <div className="h-6 w-48 animate-pulse rounded bg-muted/30" />
            ) : (
              <div className="space-y-2">
                <motion.p
                  initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                  transition={{ duration: 0.8, ease: "easeOut", delay: shouldAnimate ? 0 : 0 }}
                  className="text-base font-semibold uppercase tracking-[0.32em] text-accent/90 sm:text-sm"
                >
                  {greeting}
                </motion.p>
              </div>
            )}

            {/* 2. Title drop with bounce (1s-1.8s) */}
            <motion.h1
              initial={shouldAnimate ? { opacity: 0, y: -40 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={{
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1],
                delay: shouldAnimate ? 1 : 0,
              }}
              className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl"
            >
              <span className="text-muted font-medium lowercase">
                {userName ? `Welcome back, ${userName}` : "Welcome to"}
              </span>
              <span className="ml-3 inline-flex items-center text-slate-950">
                Clinical reasoning made simple
              </span>
            </motion.h1>

            {/* 4. Subtitle slide-up (2.4s-3s) */}
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={{ duration: 0.6, ease: "easeOut", delay: shouldAnimate ? 2.4 : 0 }}
              className="mx-auto mt-4 max-w-xl text-lg font-medium text-muted sm:text-xl"
            >
              A personalized AI companion for clinical reasoning, case review, and medical learning.
            </motion.p>
          </div>
        </div>

        {/* 5. Cards staggered entrance (3s-4s) */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={shouldAnimate ? { opacity: 1 } : false}
          transition={{ duration: 0.5, delay: shouldAnimate ? 3 : 0 }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {modes.map((mode, index) => (
            <motion.div
              key={mode.href}
              initial={shouldAnimate ? { opacity: 0, y: 30 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: shouldAnimate ? 3 + index * 0.15 : 0,
              }}
              whileHover={{ y: -4 }}
              className="block h-full"
            >
              <Link href={mode.href} className="block h-full">
                <GlassCard
                  hover
                  className={`group relative h-full overflow-hidden bg-gradient-to-br ${mode.accent} transition-shadow duration-200 hover:shadow-lg`}
                >
                  <div className="relative z-10">
                    <span className="text-3xl">{mode.icon}</span>
                    <h2 className="mt-4 text-xl font-semibold transition-colors group-hover:text-accent">
                      {mode.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{mode.description}</p>
                    <p className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                      Open
                      <motion.span className="inline-block" whileHover={{ x: 4 }}>
                        →
                      </motion.span>
                    </p>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* 6. Powered by Groq badge */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={shouldAnimate ? { opacity: 1 } : false}
          transition={{ duration: 0.5, delay: shouldAnimate ? 3.5 : 0 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted">
            Powered by{" "}
            <span className="font-semibold text-accent">Groq</span>
          </p>
        </motion.div>
      </motion.section>
    </AppShell>
  );
}
