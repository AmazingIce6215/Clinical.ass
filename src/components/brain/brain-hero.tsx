"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

type RegionId = "frontal" | "parietal" | "temporal" | "occipital" | "cerebellum" | "brainstem";

type Region = {
  id: RegionId;
  title: string;
  label: string;
  description: string;
  accent: string;
  left: string;
  top: string;
  width: string;
  height: string;
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

const regions: Region[] = [
  {
    id: "frontal",
    title: "Frontal network",
    label: "Reasoning and planning",
    description: "Prefrontal attention, working memory, and decision sequencing.",
    accent: "rgba(79, 70, 229, 0.8)",
    left: "17%",
    top: "18%",
    width: "30%",
    height: "28%",
  },
  {
    id: "parietal",
    title: "Parietal network",
    label: "Integration and attention",
    description: "Sensory integration, spatial mapping, and clinical pattern synthesis.",
    accent: "rgba(6, 182, 212, 0.82)",
    left: "39%",
    top: "12%",
    width: "32%",
    height: "30%",
  },
  {
    id: "temporal",
    title: "Temporal network",
    label: "Language and recall",
    description: "Semantic recall, language cues, and memory-linked clinical signals.",
    accent: "rgba(59, 130, 246, 0.82)",
    left: "18%",
    top: "40%",
    width: "30%",
    height: "26%",
  },
  {
    id: "occipital",
    title: "Occipital network",
    label: "Visual interpretation",
    description: "Image-based reasoning, visual anchors, and pattern recognition.",
    accent: "rgba(14, 165, 233, 0.82)",
    left: "63%",
    top: "18%",
    width: "20%",
    height: "22%",
  },
  {
    id: "cerebellum",
    title: "Cerebellar feedback",
    label: "Timing and coordination",
    description: "Timing, motor calibration, and procedural flow stability.",
    accent: "rgba(99, 102, 241, 0.82)",
    left: "49%",
    top: "60%",
    width: "24%",
    height: "18%",
  },
  {
    id: "brainstem",
    title: "Brainstem control",
    label: "Autonomic baseline",
    description: "Vital-state awareness, arousal, and pathway anchoring.",
    accent: "rgba(16, 185, 129, 0.82)",
    left: "70%",
    top: "49%",
    width: "15%",
    height: "24%",
  },
];

const pulseNodes: PulseNode[] = [
  { id: "p1", left: "28%", top: "24%", delay: 0.2, size: 12 },
  { id: "p2", left: "45%", top: "18%", delay: 1.1, size: 10 },
  { id: "p3", left: "58%", top: "28%", delay: 0.7, size: 11 },
  { id: "p4", left: "33%", top: "46%", delay: 1.6, size: 9 },
  { id: "p5", left: "63%", top: "50%", delay: 0.9, size: 10 },
  { id: "p6", left: "51%", top: "66%", delay: 1.8, size: 11 },
];

const pulseLines = [
  "M136 150C196 118 248 116 310 154",
  "M286 118C354 88 416 92 480 140",
  "M166 246C228 220 282 222 346 258",
  "M330 198C388 174 448 182 510 226",
  "M350 322C412 304 468 314 526 358",
  "M472 312C516 280 556 278 604 318",
];

const heroActions = [
  { href: "/clinical", label: "Start a clinical case", tone: "primary" as const },
  { href: "/osce", label: "Launch OSCE mode" },
  { href: "/teaching", label: "Open teaching bank" },
  { href: "/image-diagnosis", label: "Image diagnosis" },
  { href: "/calculators", label: "Calculator" },
  { href: "/explore", label: "See all modules" },
];

function greetingLine(name: string) {
  if (!name) return "Welcome to a sharper clinical workspace";
  return `Welcome back, ${name}`;
}

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${8 + ((index * 11) % 78)}%`,
    top: `${12 + ((index * 17) % 70)}%`,
    size: 2 + ((index * 7) % 5),
    driftX: ((index % 2 === 0 ? 1 : -1) * (8 + ((index * 3) % 18))) / 10,
    driftY: ((index % 3 === 0 ? -1 : 1) * (10 + ((index * 5) % 22))) / 10,
    duration: 14 + (index % 5) * 2,
    delay: (index % 7) * 0.7,
    opacity: 0.35 + ((index % 4) * 0.1),
  }));
}

export function BrainHero() {
  const { session } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [activeRegion, setActiveRegion] = useState<RegionId>(regions[0].id);
  const [activePulses, setActivePulses] = useState<string[]>([]);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const particles = useMemo(() => buildParticles(20), []);
  const activeInfo = regions.find((region) => region.id === activeRegion) ?? regions[0];
  const firstName = session?.firstName?.trim() ?? "";

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

    pulseNodes.forEach(scheduleNode);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const update = (clientX: number, clientY: number, rect: DOMRect) => {
      const x = ((clientX - rect.left) / rect.width - 0.5) * 18;
      const y = ((clientY - rect.top) / rect.height - 0.5) * -18;
      setParallax({ x, y });
    };

    const reset = () => setParallax({ x: 0, y: 0 });
    const target = document.querySelector<HTMLElement>("[data-brain-scene]");

    if (!target) return undefined;

    const handleMove = (event: PointerEvent) => {
      update(event.clientX, event.clientY, target.getBoundingClientRect());
    };

    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerleave", reset);

    return () => {
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerleave", reset);
    };
  }, [prefersReducedMotion]);

  return (
    <section className="brain-hero-grid">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="brain-hero-copy"
      >
        <p className="brain-hero-kicker">{greetingLine(firstName)}</p>
        <h1 className="brain-hero-title">
          Clinical reasoning, exam practice, and decision support.
        </h1>
        <p className="brain-hero-lead">
          A polished, high-signal environment for working through cases, training exam flow, and moving
          faster from symptom to safe clinical answer.
        </p>

        <div className="brain-hero-actions">
          {heroActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn("brain-action", action.tone === "primary" && "brain-action--primary")}
            >
              {action.label}
            </Link>
          ))}
        </div>

        <div className="brain-hero-metrics" aria-label="Clinical workflow highlights">
          <article className="brain-metric">
            <span className="brain-metric__label">Neural activity</span>
            <strong>Analyzing patterns</strong>
            <p>Layered reasoning signals and case-aware prompts.</p>
          </article>
          <article className="brain-metric">
            <span className="brain-metric__label">Knowledge base</span>
            <strong>218,430+ concepts</strong>
            <p>Reference-backed teaching and differential support.</p>
          </article>
          <article className="brain-metric">
            <span className="brain-metric__label">Confidence</span>
            <strong>High</strong>
            <p>Fast-path support for safe, structured decisions.</p>
          </article>
        </div>
      </motion.div>

      <motion.div
        data-brain-scene
        initial={{ opacity: 0, scale: 0.975 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        className="brain-scene"
      >
        <div className="brain-scene__backdrop" aria-hidden="true" />
        <div className="brain-scene__grid" aria-hidden="true" />
        <div className="brain-scene__glow brain-scene__glow--a" aria-hidden="true" />
        <div className="brain-scene__glow brain-scene__glow--b" aria-hidden="true" />

        <motion.div
          className="brain-orbit"
          animate={prefersReducedMotion ? undefined : { rotate: 360, scale: [0.995, 1.015, 0.995] }}
          transition={
            prefersReducedMotion
              ? undefined
              : { rotate: { duration: 120, repeat: Number.POSITIVE_INFINITY, ease: "linear" }, scale: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } }
          }
        >
          <div
            className="brain-core"
            style={
              {
                "--parallax-x": `${parallax.x}px`,
                "--parallax-y": `${parallax.y}px`,
                "--parallax-rotate-x": `${parallax.y * 0.35}deg`,
                "--parallax-rotate-y": `${parallax.x * 0.35}deg`,
              } as React.CSSProperties
            }
          >
            <div className="brain-shell brain-shell--left" aria-hidden="true" />
            <div className="brain-shell brain-shell--right" aria-hidden="true" />
            <div className="brain-shell brain-shell--stem" aria-hidden="true" />
            <div className="brain-shell brain-shell--cerebellum" aria-hidden="true" />
            <div className="brain-shell brain-shell--highlight" aria-hidden="true" />

            <svg className="brain-network" viewBox="0 0 720 560" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="brainStroke" x1="110" y1="80" x2="620" y2="470" gradientUnits="userSpaceOnUse">
                  <stop stopColor="rgba(29, 78, 216, 0.28)" />
                  <stop offset="0.52" stopColor="rgba(59, 130, 246, 0.9)" />
                  <stop offset="1" stopColor="rgba(14, 165, 233, 0.45)" />
                </linearGradient>
              </defs>
              {pulseLines.map((d) => (
                <path key={d} d={d} stroke="url(#brainStroke)" strokeWidth="1.25" strokeOpacity="0.55" />
              ))}
              <path
                d="M144 176C196 114 270 90 332 122C380 145 426 144 480 126C535 107 589 128 624 184"
                stroke="rgba(14, 165, 233, 0.24)"
                strokeWidth="1.2"
              />
              <path
                d="M140 250C184 210 224 194 280 194C330 194 382 212 436 242C492 274 548 284 616 274"
                stroke="rgba(99, 102, 241, 0.18)"
                strokeWidth="1.2"
              />
            </svg>

            <div className="brain-neurons" aria-hidden="true">
              {pulseNodes.map((node) => {
                const isActive = activePulses.includes(node.id);

                return (
                  <motion.span
                    key={node.id}
                    className={cn("brain-pulse", isActive && "brain-pulse--active")}
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
            </div>

            {particles.map((particle) => (
              <motion.span
                key={particle.id}
                className="brain-particle"
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

            {regions.map((region) => {
              const isActive = region.id === activeRegion;

              return (
                <button
                  key={region.id}
                  type="button"
                  className={cn("brain-region", isActive && "brain-region--active")}
                  style={
                    {
                      left: region.left,
                      top: region.top,
                      width: region.width,
                      height: region.height,
                      "--region-accent": region.accent,
                    } as React.CSSProperties
                  }
                  onPointerEnter={() => setActiveRegion(region.id)}
                  onClick={() => setActiveRegion(region.id)}
                  onFocus={() => setActiveRegion(region.id)}
                  aria-pressed={isActive}
                  aria-label={region.title}
                >
                  <span className="brain-region__label">{region.label}</span>
                </button>
              );
            })}

            <div className="brain-focus">
              <span className="brain-focus__pin" aria-hidden="true" />
              <span className="brain-focus__halo" aria-hidden="true" />
            </div>

            <div className="brain-orbit-ring" aria-hidden="true" />
          </div>
        </motion.div>

        <div className="brain-scene__caption">
          <div>
            <span className="brain-scene__eyebrow">Clinical analysis layer</span>
            <strong>{activeInfo.title}</strong>
            <p>{activeInfo.description}</p>
          </div>
          <div className="brain-scene__caption-meta">
            <span>Drag to explore</span>
            <span>Mouse parallax + region hover</span>
          </div>
        </div>

        <div className="brain-region-card">
          <span className="brain-region-card__kicker">{activeInfo.label}</span>
          <strong>{activeInfo.title}</strong>
          <p>{activeInfo.description}</p>
        </div>
      </motion.div>
    </section>
  );
}
