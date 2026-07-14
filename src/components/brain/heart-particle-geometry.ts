import { createNoise3D } from "simplex-noise";

export const DESKTOP_HEART_PARTICLES = 9600;
export const LOW_POWER_HEART_PARTICLES = 4800;

export type HeartPerformanceSignals = {
  width: number;
  devicePixelRatio: number;
  hardwareConcurrency?: number;
  coarsePointer: boolean;
};

export type HeartPerformanceProfile = {
  particleCount: number;
  maxDpr: number;
  lowPower: boolean;
};

export type HeartParticleData = {
  positions: Float32Array;
  seeds: Float32Array;
  sizes: Float32Array;
  colorMixes: Float32Array;
  edgeFactors: Float32Array;
  colors: Float32Array;
  phases: Float32Array;
  frequencies: Float32Array;
};

export type HeartParticlePopulation = "interior" | "rim";

export function getHeartPerformanceProfile(
  signals: HeartPerformanceSignals,
): HeartPerformanceProfile {
  const lowPower =
    signals.coarsePointer ||
    signals.width < 768 ||
    signals.devicePixelRatio > 1.75 ||
    (signals.hardwareConcurrency ?? 8) <= 4;

  return {
    lowPower,
    particleCount: lowPower ? LOW_POWER_HEART_PARTICLES : DESKTOP_HEART_PARTICLES,
    maxDpr: lowPower ? 1.25 : 1.75,
  };
}

function mulberry32(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function heartBoundary(t: number) {
  const sinT = Math.sin(t);
  const x = 16 * sinT * sinT * sinT;
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);

  return { x, y };
}

export function buildHeartParticleData(
  count: number,
  seed = 0x48454152,
  population: HeartParticlePopulation = "interior",
): HeartParticleData {
  const random = mulberry32(seed);
  const noiseRandom = mulberry32(seed ^ 0x9e3779b9);
  const noise3D = createNoise3D(noiseRandom);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colorMixes = new Float32Array(count);
  const edgeFactors = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const frequencies = new Float32Array(count);
  const scale = 0.073;
  const radialCenterY = -2;

  for (let index = 0; index < count; index += 1) {
    const t =
      population === "rim"
        ? ((index + random() * 0.72) / count) * Math.PI * 2
        : random() * Math.PI * 2;
    const boundary = heartBoundary(t);
    const radial =
      population === "rim"
        ? 0.982 + (random() * 2 - 1) * 0.018
        : Math.sqrt(random()) * 0.9;
    const centerWeightedY =
      radialCenterY + (boundary.y - radialCenterY) * radial;
    const organicNoise = noise3D(
      boundary.x * 0.045,
      boundary.y * 0.045,
      index * 0.012,
    );
    const edgeJitter =
      organicNoise * (population === "rim" ? 0.014 : 0.009 + radial * 0.012);
    const thickness =
      population === "rim"
        ? 0.09
        : 0.58 * Math.sqrt(Math.max(0, 1 - radial * radial));
    const surfaceParticle = population === "interior" && random() < 0.7;
    const zMagnitude =
      population === "rim"
        ? random() * thickness
        : thickness * (surfaceParticle ? 0.75 + random() * 0.25 : random());
    const z =
      zMagnitude * (random() < 0.5 ? -1 : 1) +
      organicNoise * 0.035 * (1 - radial);
    const positionIndex = index * 3;

    positions[positionIndex] = boundary.x * radial * scale + edgeJitter;
    positions[positionIndex + 1] =
      centerWeightedY * scale + 0.09 + edgeJitter * 0.7;
    positions[positionIndex + 2] = z;
    seeds[index] = random();
    sizes[index] =
      (population === "rim" ? 0.92 : 0.56) +
      random() * (population === "rim" ? 0.72 : 0.68);
    edgeFactors[index] = radial;
    phases[index] = random() * Math.PI * 2;
    frequencies[index] =
      (population === "rim" ? 1.05 : 0.68) + random() * 2.35;
    colorMixes[index] = Math.min(
      1,
      Math.max(0, 0.48 + organicNoise * 0.24 + z * 0.34 + random() * 0.12),
    );

    const colorIndex = index * 3;
    const deep = [0.557, 0.059, 0.133];
    const mid = [0.914, 0.125, 0.227];
    const bright = [1, 0.353, 0.353];
    const warmth =
      population === "rim"
        ? 0.78 + random() * 0.22
        : Math.min(0.72, radial * 0.55 + Math.abs(z) * 0.16);
    const lower = population === "rim" ? mid : deep;
    const upper = population === "rim" ? bright : mid;
    colors[colorIndex] = lower[0] + (upper[0] - lower[0]) * warmth;
    colors[colorIndex + 1] = lower[1] + (upper[1] - lower[1]) * warmth;
    colors[colorIndex + 2] = lower[2] + (upper[2] - lower[2]) * warmth;
  }

  return {
    positions,
    seeds,
    sizes,
    colorMixes,
    edgeFactors,
    colors,
    phases,
    frequencies,
  };
}
