"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell, GlassCard } from "@/components/app-shell";

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
  {
    href: "/image-diagnosis",
    title: "Image Diagnosis",
    description:
      "Upload a medical image and get a concise visual impression, key findings, and standard management.",
    icon: "🖼️",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
] as const;

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

function getStoredName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("clinicalass_username")?.trim() || "";
}

export default function HomePage() {
  const [greeting] = useState(() => pickGreeting(getStoredName()));
  const [isFirstVisit] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("clinicalass_username");
  });
  const [showPrompt, setShowPrompt] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("clinicalass_username");
  });
  const [promptName, setPromptName] = useState("");
  const [isPromptVisible, setIsPromptVisible] = useState(true);
  const [promptEntered, setPromptEntered] = useState(false);
  const [heroStage, setHeroStage] = useState<"greeting" | "tagline">("greeting");
  const [homepageVisible, setHomepageVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("clinicalass_username"));
  });
  const [hasAnimated] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("homepageAnimated") === "true";
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const titleText = useMemo(
    () => (isFirstVisit ? "Say hi to Clinical.ass" : "Welcome back to Clinical.ass"),
    [isFirstVisit],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    const enterTimer = window.setTimeout(() => setPromptEntered(true), 20);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.clearTimeout(enterTimer);
    };
  }, []);

  useEffect(() => {
    if (!homepageVisible) return;
    const timer = window.setTimeout(() => {
      setHeroStage("tagline");
      sessionStorage.setItem("homepageAnimated", "true");
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [homepageVisible]);

  const shouldAnimate = !hasAnimated && !prefersReducedMotion && homepageVisible;

  return (
    <AppShell>
      <div className="relative min-h-[calc(100dvh-6rem)] overflow-hidden">
        <div className="homepage-orbs" aria-hidden="true">
          <span className="homepage-orb homepage-orb--one" />
          <span className="homepage-orb homepage-orb--two" />
          <span className="homepage-orb homepage-orb--three" />
          <span className="homepage-orb homepage-orb--four" />
        </div>
        {showPrompt ? (
          <div
            className={`absolute inset-0 z-20 flex items-center justify-center px-4 ${
              isPromptVisible ? "prompt-shell prompt-shell--visible" : "prompt-shell prompt-shell--exit"
            } ${promptEntered ? "prompt-shell--entered" : ""}`}
          >
            <div className="w-full max-w-xl text-center">
              <p className="mx-auto max-w-lg text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Hey, what should we call you?
              </p>
              <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
                <input
                  value={promptName}
                  onChange={(event) => setPromptName(event.target.value)}
                  placeholder="Your name"
                  className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-surface/90 px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted/60 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextName = promptName.trim() || "Stranger";
                    localStorage.setItem("clinicalass_username", nextName);
                    setIsPromptVisible(false);
                    setTimeout(() => {
                      setShowPrompt(false);
                      setHomepageVisible(true);
                    }, 350);
                  }}
                  className="rounded-2xl bg-accent px-5 py-3 text-base font-semibold text-accent-foreground transition hover:bg-accent/90"
                >
                  Nice, that&apos;s me
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("clinicalass_username", "Stranger");
                  setIsPromptVisible(false);
                  setTimeout(() => {
                    setShowPrompt(false);
                    setHomepageVisible(true);
                  }, 350);
                }}
                className="mt-4 text-sm text-muted underline-offset-4 transition hover:text-foreground hover:underline"
              >
                I&apos;d rather stay anonymous
              </button>
            </div>
          </div>
        ) : null}

        {homepageVisible ? (
          <motion.section
            key="homepage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
                <div className="hero-cube-perspective mx-auto">
                  <div className={`hero-cube ${heroStage === "tagline" ? "hero-cube--turned" : ""}`}>
                    <div className="hero-cube__face hero-cube__face--front">
                      <p className="hero-cube__text uppercase tracking-[0.32em] text-accent/90">
                        {greeting}
                      </p>
                    </div>
                    <div className="hero-cube__face hero-cube__face--bottom">
                      <h1 className="hero-cube__text">{titleText}</h1>
                    </div>
                  </div>
                </div>

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

            <motion.div
              initial={shouldAnimate ? { opacity: 0 } : false}
              animate={shouldAnimate ? { opacity: 1 } : false}
              transition={{ duration: 0.5, delay: shouldAnimate ? 3 : 0 }}
              className="flex w-full flex-nowrap items-stretch gap-4 overflow-x-auto pb-1 lg:overflow-visible"
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
                  className="flex h-full min-w-[14rem] flex-1 basis-0 self-stretch"
                >
                  <Link href={mode.href} className="block h-full">
                    <GlassCard
                      hover
                      className={`group relative flex h-full min-h-[17rem] flex-col overflow-hidden bg-gradient-to-br ${mode.accent} p-4 transition-shadow duration-200 hover:shadow-lg`}
                    >
                      <div className="relative z-10 flex h-full flex-col">
                        <span className="text-3xl">{mode.icon}</span>
                        <h2 className="mt-3 text-lg font-semibold leading-tight transition-colors group-hover:text-accent">
                          {mode.title}
                        </h2>
                        <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">
                          {mode.description}
                        </p>
                        <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
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

            <motion.footer
              initial={shouldAnimate ? { opacity: 0 } : false}
              animate={shouldAnimate ? { opacity: 1 } : false}
              transition={{ duration: 0.6, delay: shouldAnimate ? 4 : 0 }}
              className="mt-10 mb-4 text-center"
            >
              <p className="inline-flex items-center gap-1.5 text-[11px] text-muted/60">
                <span className="text-muted/50">🛡️</span>
                All data stored locally — nothing leaves your device
              </p>
            </motion.footer>
          </motion.section>
        ) : null}
      </div>
    </AppShell>
  );
}
