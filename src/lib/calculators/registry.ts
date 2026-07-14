import type { CalculatorCategory, CalculatorDefinition } from "./types";
import { gcs } from "./definitions/gcs";
import { curb65 } from "./definitions/curb65";
import { wellsPE } from "./definitions/wells-pe";
import { wellsDVT } from "./definitions/wells-dvt";
import { heart } from "./definitions/heart";
import { cha2ds2Vasc } from "./definitions/cha2ds2-vasc";
import { hasBled } from "./definitions/has-bled";
import { sofa } from "./definitions/sofa";
import { childPugh } from "./definitions/child-pugh";
import { bishop } from "./definitions/bishop";

export const CALCULATOR_FAVORITES_STORAGE_KEY = "calc_favorites";

const calculators: readonly CalculatorDefinition[] = [
  gcs,
  curb65,
  wellsPE,
  wellsDVT,
  heart,
  cha2ds2Vasc,
  hasBled,
  sofa,
  childPugh,
  bishop,
];

const calculatorMap = new Map(calculators.map((c) => [c.slug, c]));

export function getAllCalculators(): readonly CalculatorDefinition[] {
  return calculators;
}

export function getCalculator(slug: string): CalculatorDefinition | undefined {
  return calculatorMap.get(slug);
}

export function searchCalculators(query: string): readonly CalculatorDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return calculators;
  return calculators.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.evidence.intendedPopulation.toLowerCase().includes(q),
  );
}

export function getCalculatorsByCategory(categoryId: string): readonly CalculatorDefinition[] {
  if (!categoryId || categoryId === "all") return calculators;
  return calculators.filter((c) => c.category === categoryId);
}

export function getCategories() {
  const seen = new Set<string>();
  return calculators.filter((c) => {
    if (seen.has(c.category)) return false;
    seen.add(c.category);
    return true;
  }).map((c) => ({
    id: c.category,
    label: formatCalculatorCategory(c.category),
    icon: c.icon,
  }));
}

export function formatCalculatorCategory(category: CalculatorCategory): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
