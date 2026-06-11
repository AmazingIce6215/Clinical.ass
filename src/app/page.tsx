"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell, GlassCard } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";

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

const GREETINGS = {
  MORNING: [
    "Good morning, {name}",
    "Rise and grind, {name}",
    "Morning, {name}. Your patients won't diagnose themselves",
    "Up early or never slept?",
    "Good morning, the wards are waiting",
    "Morning rounds start with you, {name}",
    "Another day, another diagnosis",
    "Morning, future doctor",
    "Caffeine loaded, {name}? Let's go",
    "The early med student gets the diagnosis",
    "Good morning. Stethoscope on, brain on",
    "Morning, {name}. Somewhere a patient needs you to know this",
  ],
  AFTERNOON: [
    "Good afternoon, {name}",
    "Afternoon grind, let's get it",
    "Post-lunch brain fog? Push through it",
    "Hey {name}, the wards called",
    "Afternoon, {name}. Halfway through the day",
    "Still at it, {name}. Respect",
    "Good afternoon, future clinician",
    "Lunch break is over. Back to it",
    "Afternoon, {name}. The textbooks aren't reading themselves",
    "Keep pushing, {name}",
    "Good afternoon. What are we learning today",
    "Afternoon session unlocked",
  ],
  EVENING: [
    "Good evening, {name}",
    "Evening grind hits different",
    "Hey {name}, still at it",
    "Evening, {name}. Most people have clocked out",
    "The evening belongs to the disciplined",
    "Good evening, future doctor",
    "Lights low, focus high",
    "Evening mode activated, {name}",
    "Good evening. One more session won't hurt",
    "Hey {name}, the library is quieter now",
    "Evening, {name}. Let's make it count",
    "Still studying? Good",
  ],
  NIGHT: [
    "Hey night owl",
    "Burning the midnight oil again",
    "It's late, {name}. But you're here",
    "Night shift studying, respect",
    "The night is yours, {name}",
    "Late night session, the best kind",
    "Everyone else is asleep. You're not",
    "Hey {name}, even the consultants are asleep right now",
    "Late nights build great doctors",
    "Midnight medicine, let's go",
    "It's quiet. Good time to actually focus",
    "You chose studying over sleep. Bold move",
  ],
} as const;

function getTimeBucket(hour: number) {
  if (hour >= 5 && hour < 12) return "MORNING";
  if (hour >= 12 && hour < 17) return "AFTERNOON";
  if (hour >= 17 && hour < 21) return "EVENING";
  return "NIGHT";
}

function pickGreeting(firstName: string) {
  const hour = new Date().getHours();
  const bucket = getTimeBucket(hour);
  const pool = GREETINGS[bucket];
  const template = pool[Math.floor(Math.random() * pool.length)];
  const name = firstName.trim();
  return template.includes("{name}") && name
    ? template.replaceAll("{name}", name)
    : template.replace(/\s*,\s*\{name\}/g, "").replaceAll("{name}", name);
}

function getProfileName(sessionFirstName?: string | null) {
  if (sessionFirstName?.trim()) return sessionFirstName.trim();
  if (typeof window === "undefined") return "";
  return localStorage.getItem("clincalass_username")?.trim() || "";
}

export default function HomePage() {
  const { session } = useAuth();
  const [firstName] = useState(() => getProfileName(session?.firstName));
  const [greeting] = useState(() => pickGreeting(getProfileName(session?.firstName)));
  const [isFirstVisit] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("clincalass-homepage-visited") !== "true"
      : false,
  );
  const [heroStage, setHeroStage] = useState<"greeting" | "tagline">("greeting");
  const [homepageVisible] = useState(true);
  const [hasAnimated] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("homepageAnimated") === "true"
      : false,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  const titleText = useMemo(
    () => (isFirstVisit ? "Say hi to Clinical.ass" : "Welcome back to Clinical.ass"),
    [isFirstVisit],
  );

  useEffect(() => {
    localStorage.setItem("clincalass-homepage-visited", "true");

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    const greetingTimer = window.setTimeout(() => {
      setHeroStage("tagline");
    }, 2000);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.clearTimeout(greetingTimer);
    };
  }, [session?.firstName]);

  const shouldAnimate = !hasAnimated && !prefersReducedMotion && homepageVisible;

  useEffect(() => {
    if (!homepageVisible || !shouldAnimate) return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("homepageAnimated", "true");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [homepageVisible, shouldAnimate]);

  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: homepageVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto flex max-w-4xl flex-1 flex-col justify-center py-8"
      >
        <div className="mb-12 text-center">
          <motion.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/10 text-5xl shadow-inner text-muted"
          >
            <span>🩺</span>
          </motion.div>

          <div className="mx-auto max-w-3xl text-center">
            <div className={`hero-line ${heroStage === "greeting" ? "hero-line--visible" : "hero-line--hidden"}`}>
              <p className="text-base font-semibold uppercase tracking-[0.32em] text-accent/90 sm:text-sm">
                {greeting}
              </p>
            </div>

            <div className={`hero-line hero-line--tagline ${heroStage === "tagline" ? "hero-line--visible" : ""}`}>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                {titleText}
              </h1>
            </div>

            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={{ duration: 0.6, ease: "easeOut", delay: shouldAnimate ? 2.4 : 0 }}
              className="mx-auto mt-4 max-w-xl text-lg font-medium text-muted sm:text-xl"
            >
              A personalized AI companion for clinical reasoning, case review, and medical learning.
            </motion.p>

            {!firstName && (
              <p className="mt-3 text-sm text-muted">
                Sign in to personalize the greeting with your first name.
              </p>
            )}
          </div>
        </div>

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
      </motion.section>
    </AppShell>
  );
}
