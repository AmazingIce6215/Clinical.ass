import {
  DESKTOP_HEART_PARTICLES,
  LOW_POWER_HEART_PARTICLES,
  buildHeartParticleData,
  getHeartPerformanceProfile,
} from "@/components/brain/heart-particle-geometry";

describe("heart particle geometry", () => {
  it("builds deterministic, bounded volumetric particle data", () => {
    const first = buildHeartParticleData(512, 42);
    const second = buildHeartParticleData(512, 42);

    expect(Array.from(first.positions)).toEqual(Array.from(second.positions));
    expect(first.positions).toHaveLength(512 * 3);
    expect(first.seeds).toHaveLength(512);
    expect(first.sizes).toHaveLength(512);
    expect(first.colorMixes).toHaveLength(512);
    expect(first.edgeFactors).toHaveLength(512);

    const zValues: number[] = [];
    for (let index = 0; index < first.positions.length; index += 3) {
      const x = first.positions[index];
      const y = first.positions[index + 1];
      const z = first.positions[index + 2];

      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
      expect(Math.abs(x)).toBeLessThan(1.35);
      expect(Math.abs(y)).toBeLessThan(1.45);
      expect(Math.abs(z)).toBeLessThan(0.65);
      zValues.push(z);
    }

    expect(Math.max(...zValues) - Math.min(...zValues)).toBeGreaterThan(0.75);
  });

  it("selects the desktop and guarded performance tiers", () => {
    expect(
      getHeartPerformanceProfile({
        width: 1440,
        devicePixelRatio: 1,
        hardwareConcurrency: 8,
        coarsePointer: false,
      }),
    ).toEqual({
      lowPower: false,
      particleCount: DESKTOP_HEART_PARTICLES,
      maxDpr: 1.75,
    });

    expect(
      getHeartPerformanceProfile({
        width: 390,
        devicePixelRatio: 3,
        hardwareConcurrency: 4,
        coarsePointer: true,
      }),
    ).toEqual({
      lowPower: true,
      particleCount: LOW_POWER_HEART_PARTICLES,
      maxDpr: 1.25,
    });
  });
});
