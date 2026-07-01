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

    if (showFavoritesOnly) list = list.filter((c) => favorites.includes(c.slug));
    if (activeCategory !== "all") list = list.filter((c) => c.category === activeCategory);

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

  const total = getAllCalculators().length;

  return (
    <AppShell
      backHref="/"
      title="Clinical Calculators"
      subtitle="Evidence-based scoring tools with a cleaner, faster browsing experience"
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <GlassCard className="glass-card--hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="shell-kicker">High-yield tools</p>
              <h1 className="shell-heading mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                Fast, polished access to the scores that matter on the wards.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                Search, filter, and save the calculators you rely on. Everything is laid out to feel
                more like a premium clinical dashboard than a utility list.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[26rem]">
              <div className="metric-tile">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Tools</p>
                <p className="metric-value mt-2">{total}</p>
              </div>
              <div className="metric-tile">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Favorites</p>
                <p className="metric-value mt-2">{favorites.length}</p>
              </div>
              <div className="metric-tile">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Focus mode</p>
                <p className="metric-value mt-2">{showFavoritesOnly ? "On" : "Off"}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                🔍
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search calculators..."
                className="w-full rounded-2xl border border-border/80 bg-surface/75 px-11 py-3 text-sm outline-none transition placeholder:text-muted/55 focus:border-accent/45 focus:ring-2 focus:ring-accent/15"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                setActiveCategory("all");
              }}
              className={cn(
                "ui-pill justify-center px-4 py-3",
                showFavoritesOnly && "ui-pill--accent border-accent/30 text-foreground",
              )}
            >
              {showFavoritesOnly ? "★ Favorites" : "☆ Favorites"}
              {favorites.length > 0 && <span>({favorites.length})</span>}
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
                  "ui-pill transition",
                  activeCategory === cat.id && "ui-pill--accent border-accent/30 text-foreground",
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
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
              <GlassCard className="py-14 text-center">
                <p className="text-2xl">🔍</p>
                <p className="mt-3 text-lg font-semibold">No calculators found</p>
                <p className="mt-2 text-sm text-muted">
                  {showFavoritesOnly
                    ? "You haven't added any favorites yet. Tap the star on any calculator."
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
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
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
