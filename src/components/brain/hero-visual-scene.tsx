"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ModuleNode = {
  id: string;
  icon: string;
  angle: number;
};

type PulseNode = {
  id: string;
  left: string;
  top: string;
  delay: number;
  size: number;
};

type Particle = {
  id: number;
  left: string;
  top: string;
  size: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  opacity: number;
};

const MODULES: ModuleNode[] = [
  { id: "clinical", icon: "🩺", angle: -90 },
  { id: "osce", icon: "🎓", angle: -30 },
  { id: "teaching", icon: "📚", angle: 30 },
  { id: "image", icon: "🖼️", angle: 90 },
  { id: "calculators", icon: "📊", angle: 150 },
  { id: "library", icon: "🗂️", angle: 210 },
];

const ORBIT_RADIUS = 8.75;

const PULSE_NODES: PulseNode[] = [
  { id: "p1", left: "34%", top: "28%", delay: 0.2, size: 10 },
  { id: "p2", left: "52%", top: "22%", delay: 1.1, size: 9 },
  { id: "p3", left: "66%", top: "38%", delay: 0.7, size: 10 },
  { id: "p4", left: "62%", top: "58%", delay: 1.6, size: 8 },
  { id: "p5", left: "42%", top: "68%", delay: 0.9, size: 9 },
  { id: "p6", left: "28%", top: "52%", delay: 1.8, size: 10 },
];

const NETWORK_PATHS = [
  "M200 200C200 148 248 118 292 118",
  "M200 200C248 200 292 168 318 132",
  "M200 200C248 228 292 248 318 268",
  "M200 200C200 252 152 282 108 282",
  "M200 200C152 200 108 232 82 268",
  "M200 200C152 172 108 152 82 132",
];

const CAPTION_MESSAGES = [
  "Reviewing the clinical picture…",
  "Cross-checking findings…",
  "Building the differential…",
  "Thinking it through…",
  "Putting it together…",
];

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${10 + ((index * 11) % 78)}%`,
    top: `${14 + ((index * 17) % 68)}%`,
    size: 2 + ((index * 7) % 5),
    driftX: ((index % 2 === 0 ? 1 : -1) * (8 + ((index * 3) % 18))) / 10,
    driftY: ((index % 3 === 0 ? -1 : 1) * (10 + ((index * 5) % 22))) / 10,
    duration: 14 + (index % 5) * 2,
    delay: (index % 7) * 0.7,
    opacity: 0.35 + ((index % 4) * 0.1),
  }));
}

function nodePosition(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const x = 50 + ORBIT_RADIUS * Math.cos(rad);
  const y = 50 + ORBIT_RADIUS * Math.sin(rad);
  return { left: `${x}%`, top: `${y}%` };
}

function RotatingCaption({ messages }: { messages: readonly string[] }) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 2800);
    return () => window.clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="hero-visual-caption" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.p
          key={messages[index]}
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeInOut" }}
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function HeroVisualScene() {
  const prefersReducedMotion = useReducedMotion();
  const [activeModule, setActiveModule] = useState(MODULES[0].id);
  const [activePulses, setActivePulses] = useState<string[]>([]);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const particles = useMemo(() => buildParticles(16), []);
  const activeIcon = MODULES.find((module) => module.id === activeModule)?.icon ?? MODULES[0].icon;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveModule((current) => {
        const index = MODULES.findIndex((module) => module.id === current);
        return MODULES[(index + 1) % MODULES.length].id;
      });
    }, 3200);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timers: number[] = [];
    let cancelled = false;

    const scheduleNode = (node: PulseNode) => {
      const run = () => {
        if (cancelled) return;

        setActivePulses((current) => (current.includes(node.id) ? current : [...current, node.id]));

        const clearTimer = window.setTimeout(() => {
          setActivePulses((current) => current.filter((pulseId) => pulseId !== node.id));
        }, 560 + Math.random() * 260);

        timers.push(clearTimer);

        const nextTimer = window.setTimeout(run, 1200 + Math.random() * 2400);
        timers.push(nextTimer);
      };

      const initialTimer = window.setTimeout(run, 500 + node.delay * 600);
      timers.push(initialTimer);
    };

    PULSE_NODES.forEach(scheduleNode);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const reset = () => setParallax({ x: 0, y: 0 });
    const target = document.querySelector<HTMLElement>("[data-hero-visual]");

    if (!target) return undefined;

    const handleMove = (event: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * -16;
      setParallax({ x, y });
    };

    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerleave", reset);

    return () => {
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerleave", reset);
    };
  }, [prefersReducedMotion]);

  return (
    <div data-hero-visual className="hero-visual-scene" aria-hidden="true">
      <div className="hero-visual-scene__backdrop" />
      <div className="hero-visual-scene__grid" />
      <div className="hero-visual-scene__glow hero-visual-scene__glow--a" />
      <div className="hero-visual-scene__glow hero-visual-scene__glow--b" />

      <div className="hero-visual-orbit-wrap">
        <div
          className="hero-visual-core"
          style={
            {
              "--parallax-x": `${parallax.x}px`,
              "--parallax-y": `${parallax.y}px`,
            } as React.CSSProperties
          }
        >
          <svg className="hero-visual-network" viewBox="0 0 400 400" fill="none">
            <defs>
              <linearGradient id="heroVisualStroke" x1="80" y1="80" x2="320" y2="320" gradientUnits="userSpaceOnUse">
                <stop stopColor="rgba(29, 78, 216, 0.28)" />
                <stop offset="0.52" stopColor="rgba(59, 130, 246, 0.9)" />
                <stop offset="1" stopColor="rgba(14, 165, 233, 0.45)" />
              </linearGradient>
            </defs>
            {NETWORK_PATHS.map((d) => (
              <path key={d} d={d} stroke="url(#heroVisualStroke)" strokeWidth="1.25" strokeOpacity="0.55" />
            ))}
            <circle cx="200" cy="200" r="72" stroke="rgba(79, 112, 221, 0.14)" strokeWidth="1" />
          </svg>

          <div className="hero-visual-ring" />
          <div className="hero-visual-ring hero-visual-ring--inner" />

          <motion.div
            className="hero-visual-orbit"
            animate={prefersReducedMotion ? undefined : { rotate: 360 }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 140, repeat: Number.POSITIVE_INFINITY, ease: "linear" }
            }
          >
            {MODULES.map((module) => {
              const position = nodePosition(module.angle);
              const isActive = module.id === activeModule;

              return (
                <motion.span
                  key={module.id}
                  className={cn("hero-visual-node", isActive && "hero-visual-node--active")}
                  style={position}
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          rotate: -360,
                          scale: isActive ? [1.08, 1.14, 1.08] : [1, 1.03, 1],
                        }
                  }
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : {
                          rotate: { duration: 140, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                          scale: {
                            duration: isActive ? 1.8 : 4.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          },
                        }
                  }
                >
                  {module.icon}
                </motion.span>
              );
            })}
          </motion.div>

          <div className="hero-visual-hub">
            <span className="hero-visual-hub__halo" />
            <AnimatePresence mode="wait">
              <motion.span
                key={activeIcon}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.28 }}
              >
                {activeIcon}
              </motion.span>
            </AnimatePresence>
          </div>

          {PULSE_NODES.map((node) => {
            const isActive = activePulses.includes(node.id);

            return (
              <motion.span
                key={node.id}
                className={cn("hero-visual-pulse", isActive && "hero-visual-pulse--active")}
                style={{ left: node.left, top: node.top, width: node.size, height: node.size }}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: isActive ? [1, 1.65, 1] : [1, 1.04, 1],
                        opacity: isActive ? [0.55, 1, 0.55] : [0.45, 0.72, 0.45],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? undefined
                    : {
                        duration: isActive ? 0.95 : 5.5 + node.delay,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }
                }
              />
            );
          })}

          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="hero-visual-particle"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
              }}
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      x: [0, particle.driftX * 12, 0],
                      y: [0, particle.driftY * 12, 0],
                      opacity: [particle.opacity * 0.6, particle.opacity, particle.opacity * 0.6],
                    }
              }
              transition={
                prefersReducedMotion
                  ? undefined
                  : {
                      duration: particle.duration,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: particle.delay,
                      ease: "easeInOut",
                    }
              }
            />
          ))}
        </div>
      </div>

      <RotatingCaption messages={CAPTION_MESSAGES} />
    </div>
  );
}
