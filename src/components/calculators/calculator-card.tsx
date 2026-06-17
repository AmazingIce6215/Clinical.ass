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
            className="group relative flex h-full flex-col p-4 transition-shadow sm:p-5"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl sm:text-3xl">{icon}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(slug);
                }}
                className={cn(
                  "text-base sm:text-lg transition",
                  isFavorite ? "text-accent" : "text-muted/40 hover:text-accent/60",
                )}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? "★" : "☆"}
              </button>
            </div>
            <h3 className="mt-2 text-sm font-semibold leading-tight transition-colors group-hover:text-accent sm:mt-3 sm:text-base">
              {title}
            </h3>
            <span className="mt-1 inline-block rounded-full border border-border/50 px-2 py-0.5 text-[10px] font-medium text-muted capitalize sm:px-2.5 sm:text-[11px]">
              {category}
            </span>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted line-clamp-2 sm:mt-2 sm:text-xs">
              {description}
            </p>
            <div className="mt-auto pt-3 sm:pt-4">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent group-hover:gap-1.5 transition-all sm:text-xs">
                Calculate
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </GlassCard>
      </Link>
    </motion.div>
  );
}
