"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/app-shell";
import { cn } from "@/lib/utils";

interface CalculatorCardProps {
  slug: string;
  title: string;
  shortName: string;
  description: string;
  icon: string;
  category: string;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
}

export function CalculatorCard({
  slug,
  title,
  shortName,
  description,
  icon,
  category,
  isFavorite,
  onToggleFavorite,
}: CalculatorCardProps) {
  return (
    <motion.div layout>
      <Link href={`/calculators/${slug}`} className="block h-full">
        <GlassCard
          hover
          className="group module-card glass-card--action transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="module-card__icon">{icon}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(slug);
              }}
              className={cn(
                "rounded-full border border-border/60 bg-surface/70 px-2.5 py-1 text-xs font-semibold transition",
                isFavorite ? "border-amber-500/40 text-amber-500" : "text-muted hover:border-accent/35 hover:text-accent",
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? "★ Saved" : "☆ Save"}
            </button>
          </div>
          <div className="space-y-2">
            <h3 className="module-card__title">{title}</h3>
            <p className="text-xs font-medium text-muted">{shortName}</p>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{category}</p>
            <p className="module-card__desc line-clamp-3">{description}</p>
          </div>
          <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition group-hover:gap-2">
            Calculate
            <span aria-hidden="true">→</span>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
