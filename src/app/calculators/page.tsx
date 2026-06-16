"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell, GlassCard } from "@/components/app-shell";
import { CalculatorCard } from "@/components/calculators/calculator-card";
import { getAllCalculators, getCategories } from "@/lib/calculators/registry";
import { cn } from "@/lib/utils";

const categories = [{ id: "all", label: "All", icon: "🔬" }, ...getCategories()];

function useFavorites() {
  const [favs, setFavs] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("calc_favorites") ?? "[]");
    } catch {
      return [];
    }
  });

  const toggle = (slug: string) => {
    setFavs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem("calc_favorites", JSON.stringify(next));
      return next;
    });
  };

  return { favorites: favs, toggleFavorite: toggle };
}

export default function CalculatorsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();

  const filtered = useMemo(() => {
    let list = getAllCalculators();

    if (showFavoritesOnly) {
      list = list.filter((c) => favorites.includes(c.slug));
    }

    if (activeCategory !== "all") {
      list = list.filter((c) => c.category === activeCategory);
    }

    const q = query.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      );
    }

    return list;
  }, [query, activeCategory, showFavoritesOnly, favorites]);

  return (
    <AppShell
      backHref="/"
      title="Clinical Calculators"
      subtitle="Evidence-based scoring tools for clinical decision support"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search calculators..."
                className="w-full rounded-xl border border-border/80 bg-surface/60 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                setActiveCategory("all");
              }}
              className={cn(
                "shrink-0 rounded-xl border px-4 py-3 text-sm font-medium transition",
                showFavoritesOnly
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border/80 bg-surface/60 text-muted hover:border-accent/30 hover:text-accent",
              )}
            >
              {showFavoritesOnly ? "★ Favorites" : "☆ Favorites"}
              {favorites.length > 0 && (
                <span className="ml-1.5 text-xs text-muted">({favorites.length})</span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setShowFavoritesOnly(false);
                }}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                  activeCategory === cat.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border/60 bg-surface/50 text-muted hover:border-accent/30 hover:text-foreground",
                )}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard className="py-12 text-center">
                <p className="text-2xl mb-2">🔍</p>
                <p className="font-medium text-foreground">No calculators found</p>
                <p className="mt-1 text-sm text-muted">
                  {showFavoritesOnly
                    ? "You haven't added any favorites yet. Tap ☆ on any calculator to add it."
                    : "Try a different search or category."}
                </p>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((calc) => (
                <CalculatorCard
                  key={calc.slug}
                  slug={calc.slug}
                  title={calc.title}
                  shortName={calc.shortName}
                  description={calc.description}
                  icon={calc.icon}
                  category={calc.category}
                  isFavorite={favorites.includes(calc.slug)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
