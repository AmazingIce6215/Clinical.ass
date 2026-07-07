"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { HeroVisualScene } from "@/components/brain/hero-visual-scene";

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

export function BrainHero() {
  const { session } = useAuth();
  const firstName = session?.firstName?.trim() ?? "";

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

        <div className="brain-hero-ai-toggle">
          <span className="brain-metric__label">AI assistance</span>
          <label className="brain-toggle">
            <input type="checkbox" className="brain-toggle__input" />
            <span className="brain-toggle__track">
              <span className="brain-toggle__thumb" />
            </span>
            <span className="brain-toggle__label">On</span>
          </label>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.975 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      >
        <HeroVisualScene />
      </motion.div>
    </section>
  );
}
