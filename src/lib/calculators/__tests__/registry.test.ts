import {
  CALCULATOR_FAVORITES_STORAGE_KEY,
  formatCalculatorCategory,
  getAllCalculators,
  getCalculator,
  searchCalculators,
} from "@/lib/calculators/registry";
import { catalogCoverageSummary, getCatalogEntries } from "@/lib/calculators/catalog";

const allowedIconKeys = new Set([
  "activity",
  "air-vent",
  "baby",
  "bone",
  "brain",
  "droplets",
  "flask-conical",
  "heart-pulse",
  "hospital",
  "kidney",
  "pill",
  "scale",
  "shield-alert",
  "stethoscope",
  "syringe",
  "thermometer",
]);

describe("calculator registry", () => {
  test("preserves unique slugs and favorites storage key", () => {
    const calculators = getAllCalculators();
    const slugs = calculators.map((calculator) => calculator.slug);

    expect(calculators.length).toBeGreaterThanOrEqual(40);
    expect(new Set(slugs).size).toBe(slugs.length);
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

  test("uses only typed Lucide keys and no decorative heart icon key", () => {
    for (const calculator of getAllCalculators()) {
      expect(allowedIconKeys.has(calculator.icon)).toBe(true);
      expect(calculator.icon).not.toBe("heart");
    }

    expect(getCalculator("heart-score")?.title).toBe("HEART Score");
    expect(getCalculator("heart-score")?.icon).toBe("activity");
  });

  test("discovers calculators by intended population and formats categories", () => {
    expect(searchCalculators("critically ill").map((calculator) => calculator.slug)).toContain("sofa");
    expect(formatCalculatorCategory("critical-care")).toBe("Critical Care");
    expect(formatCalculatorCategory("mental-health")).toBe("Mental Health");
  });

  test("preserves representative scoring behavior", () => {
    const heart = getCalculator("heart-score");
    const gcs = getCalculator("gcs");
    const curb65 = getCalculator("curb-65");
    const qsofa = getCalculator("qsofa");
    const bmi = getCalculator("bmi-bsa-mosteller");
    const ckd = getCalculator("ckd-epi-2021");

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
    expect(qsofa?.calculate({ rr: true, sbp: true, ams: false })).toMatchObject({
      score: 2,
      maxScore: 3,
      severity: "high",
    });
    expect(bmi?.calculate({ weight: 70, height: 175 })).toMatchObject({
      kind: "formula",
      label: "Healthy weight range (BMI)",
    });
    expect(bmi?.calculate({ weight: 70, height: 175 }).score).toBeCloseTo(22.9, 0);
    expect(ckd?.calculate({ sex: "male", age: 50, creatinine: 88.4 }).kind).toBe("formula");
  });

  test("tracks catalog coverage for the Medscape-scale checklist", () => {
    const summary = catalogCoverageSummary();
    expect(summary.total).toBeGreaterThan(400);
    expect(summary.shipped).toBeGreaterThanOrEqual(getAllCalculators().length);
    expect(getCatalogEntries("shipped").length).toBe(summary.shipped);
  });
});
