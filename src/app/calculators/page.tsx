"use client";

import { useCallback, useMemo, useSyncExternalStore, useState } from "react";
import { Calculator, Info, Search, SearchX, Star, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CalculatorCard } from "@/components/calculators/calculator-card";
import {
  CALCULATOR_FAVORITES_STORAGE_KEY,
  getAllCalculators,
  getCategories,
} from "@/lib/calculators/registry";
import { cn } from "@/lib/utils";

const categories = getCategories();
const favoriteStoreListeners = new Set<() => void>();
let memoryFavoritesSnapshot = "[]";

function readFavoritesSnapshot(): string {
  if (typeof window === "undefined") return "[]";

  try {
    return window.localStorage.getItem(CALCULATOR_FAVORITES_STORAGE_KEY) ?? "[]";
  } catch {
    return memoryFavoritesSnapshot;
  }
}

function subscribeToFavorites(onStoreChange: () => void): () => void {
  favoriteStoreListeners.add(onStoreChange);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CALCULATOR_FAVORITES_STORAGE_KEY) onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    favoriteStoreListeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function parseFavorites(snapshot: string): string[] {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites: string[]) {
  const snapshot = JSON.stringify(favorites);
  memoryFavoritesSnapshot = snapshot;

  try {
    window.localStorage.setItem(CALCULATOR_FAVORITES_STORAGE_KEY, snapshot);
  } catch {
    // Keep the in-memory snapshot available when browser storage is unavailable.
  }

  favoriteStoreListeners.forEach((listener) => listener());
}

function useFavorites() {
  const snapshot = useSyncExternalStore(subscribeToFavorites, readFavoritesSnapshot, () => "[]");
  const favorites = useMemo(() => parseFavorites(snapshot), [snapshot]);

  const toggleFavorite = useCallback(
    (slug: string) => {
      writeFavorites(
        favorites.includes(slug)
          ? favorites.filter((favorite) => favorite !== slug)
          : [...favorites, slug],
      );
    },
    [favorites],
  );

  return { favorites, toggleFavorite };
}

export default function CalculatorsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();

  const filteredCalculators = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return getAllCalculators().filter((calculator) => {
      if (showSavedOnly && !favorites.includes(calculator.slug)) return false;
      if (activeCategory !== "all" && calculator.category !== activeCategory) return false;
      if (!normalizedQuery) return true;

      return [
        calculator.title,
        calculator.shortName,
        calculator.description,
        calculator.category,
        calculator.evidence.intendedPopulation,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [activeCategory, favorites, query, showSavedOnly]);

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("all");
    setShowSavedOnly(false);
  };

  return (
    <AppShell
      backHref="/dashboard"
      title="Clinical calculators"
      subtitle="Referenced educational scoring tools"
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <span className="hidden size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-accent sm:flex">
              <Calculator className="size-5" aria-hidden="true" />
            </span>
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Clinical reference</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Clinical calculators
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
                Review scoring criteria, calculate a result, and check the intended population,
                exclusions, limitations, and source references for each tool.
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-3 rounded-lg border border-border bg-background p-3 text-xs leading-5 text-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <p>
              For education and supervised clinical learning. These tools do not replace a complete
              assessment, current local guidance, or qualified clinical judgment.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-border bg-surface p-4 shadow-sm" aria-label="Calculator filters">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="calculator-search" className="text-sm font-medium text-foreground">
                Search calculators
              </label>
              <div className="relative mt-1.5">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="calculator-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by score, specialty, or population"
                  className="min-h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 motion-reduce:transition-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSavedOnly((current) => !current)}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none",
                showSavedOnly
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-foreground hover:border-accent/50",
              )}
              aria-pressed={showSavedOnly}
            >
              <Star className="size-4" fill={showSavedOnly ? "currentColor" : "none"} aria-hidden="true" />
              Saved calculators
              {favorites.length > 0 ? (
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums">{favorites.length}</span>
              ) : null}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by specialty">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "min-h-11 rounded-lg border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none",
                activeCategory === "all"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-muted hover:border-accent/50 hover:text-foreground",
              )}
              aria-pressed={activeCategory === "all"}
            >
              All specialties
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "min-h-11 rounded-lg border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none",
                  activeCategory === category.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-background text-muted hover:border-accent/50 hover:text-foreground",
                )}
                aria-pressed={activeCategory === category.id}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="calculator-list-heading">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id="calculator-list-heading" className="text-sm font-semibold text-foreground">
              Available tools
            </h2>
            <p className="text-sm tabular-nums text-muted" aria-live="polite">
              {filteredCalculators.length} {filteredCalculators.length === 1 ? "calculator" : "calculators"}
            </p>
          </div>

          {filteredCalculators.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCalculators.map((calculator) => (
                <CalculatorCard
                  key={calculator.slug}
                  calculator={calculator}
                  isFavorite={favorites.includes(calculator.slug)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface px-5 py-12 text-center shadow-sm">
              <SearchX className="mx-auto size-8 text-muted" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-semibold text-foreground">No calculators match these filters</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                Adjust the search, specialty, or saved-only filter to return to the full catalog.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
              >
                <X className="size-4" aria-hidden="true" />
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
