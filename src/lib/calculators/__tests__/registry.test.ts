import {
  CALCULATOR_FAVORITES_STORAGE_KEY,
  formatCalculatorCategory,
  getAllCalculators,
  getCalculator,
  searchCalculators,
} from "@/lib/calculators/registry";

const allowedIconKeys = new Set([
  "activity",
  "air-vent",
  "baby",
  "brain",
  "droplets",
  "shield-alert",
  "stethoscope",
]);

describe("calculator registry", () => {
  test("preserves the calculator catalog and favorites storage key", () => {
    const calculators = getAllCalculators();

    expect(calculators).toHaveLength(10);
    expect(new Set(calculators.map((calculator) => calculator.slug))).toHaveProperty("size", 10);
    expect(CALCULATOR_FAVORITES_STORAGE_KEY).toBe("calc_favorites");
  });

  test("provides structured evidence metadata for every calculator", () => {
    for (const calculator of getAllCalculators()) {
      expect(calculator.evidence.version.length).toBeGreaterThan(10);
      expect(calculator.evidence.intendedPopulation.length).toBeGreaterThan(20);
      expect(calculator.evidence.exclusions.length).toBeGreaterThanOrEqual(2);
      expect(calculator.evidence.references.length).toBeGreaterThanOrEqual(2);
      expect(calculator.evidence.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      for (const reference of calculator.evidence.references) {
        expect(reference.title).not.toHaveLength(0);
        expect(reference.citation).not.toHaveLength(0);
        expect(reference.url).toMatch(/^https:\/\//);
      }
    }
  });

  test("uses only typed Lucide keys and no decorative heart icon", () => {
    for (const calculator of getAllCalculators()) {
      expect(allowedIconKeys.has(calculator.icon)).toBe(true);
      expect(calculator.icon).not.toContain("heart");
    }

    expect(getCalculator("heart-score")?.title).toBe("HEART Score");
    expect(getCalculator("heart-score")?.icon).toBe("activity");
  });

  test("discovers calculators by intended population and formats categories", () => {
    expect(searchCalculators("critically ill").map((calculator) => calculator.slug)).toContain("sofa");
    expect(formatCalculatorCategory("critical-care")).toBe("Critical Care");
  });

  test("preserves representative scoring behavior", () => {
    const heart = getCalculator("heart-score");
    const gcs = getCalculator("gcs");
    const curb65 = getCalculator("curb-65");

    expect(
      heart?.calculate({ history: "2", ecg: "2", age: "2", risk_factors: "2", troponin: "2" }),
    ).toMatchObject({ score: 10, maxScore: 10, severity: "high" });
    expect(gcs?.calculate({ eye: "4", verbal: "5", motor: "6" })).toMatchObject({
      score: 15,
      maxScore: 15,
      severity: "low",
    });
    expect(
      curb65?.calculate({ confusion: true, urea: true, rr: true, bp: true, age: true }),
    ).toMatchObject({ score: 5, maxScore: 5, severity: "severe" });
  });
});
