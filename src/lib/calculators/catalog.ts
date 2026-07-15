import type { CatalogEntry, CatalogStatus } from "./types";
import catalogData from "./catalog-data.json";

export const CALCULATOR_CATALOG: readonly CatalogEntry[] = catalogData as CatalogEntry[];

export function getCatalogEntries(status?: CatalogStatus): readonly CatalogEntry[] {
  if (!status) return CALCULATOR_CATALOG;
  return CALCULATOR_CATALOG.filter((entry) => entry.status === status);
}

export function getCatalogEntry(slug: string): CatalogEntry | undefined {
  return CALCULATOR_CATALOG.find((entry) => entry.slug === slug);
}

export function catalogCoverageSummary() {
  const summary = { shipped: 0, planned: 0, deferred: 0, total: CALCULATOR_CATALOG.length };
  for (const entry of CALCULATOR_CATALOG) {
    summary[entry.status] += 1;
  }
  return summary;
}
