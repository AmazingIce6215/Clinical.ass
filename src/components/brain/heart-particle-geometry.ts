import { createNoise3D } from "simplex-noise";

export const DESKTOP_HEART_PARTICLES = 5200;
export const LOW_POWER_HEART_PARTICLES = 2600;

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
};

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
): HeartParticleData {
  const random = mulberry32(seed);
  const noiseRandom = mulberry32(seed ^ 0x9e3779b9);
  const noise3D = createNoise3D(noiseRandom);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colorMixes = new Float32Array(count);
  const edgeFactors = new Float32Array(count);
  const scale = 0.073;
  const radialCenterY = -2;

  for (let index = 0; index < count; index += 1) {
    const t = random() * Math.PI * 2;
    const boundary = heartBoundary(t);
    const boundaryLayer = random() < 0.44;
    const radial = boundaryLayer
      ? 0.84 + Math.pow(random(), 0.28) * 0.16
      : Math.sqrt(random()) * 0.92;
    const centerWeightedY =
      radialCenterY + (boundary.y - radialCenterY) * radial;
    const organicNoise = noise3D(
      boundary.x * 0.045,
      boundary.y * 0.045,
      index * 0.012,
    );
    const edgeJitter = organicNoise * (0.009 + radial * 0.018);
    const thickness =
      0.56 * Math.pow(Math.max(0, 1 - radial * radial), 0.42);
    const z =
      (random() * 2 - 1) * thickness +
      organicNoise * 0.035 * (1 - radial);
    const positionIndex = index * 3;

    positions[positionIndex] = boundary.x * radial * scale + edgeJitter;
    positions[positionIndex + 1] =
      centerWeightedY * scale + 0.09 + edgeJitter * 0.7;
    positions[positionIndex + 2] = z;
    seeds[index] = random();
    sizes[index] =
      (boundaryLayer ? 0.94 : 0.62) + random() * (boundaryLayer ? 0.8 : 0.72);
    edgeFactors[index] = radial;
    colorMixes[index] = Math.min(
      1,
      Math.max(0, 0.48 + organicNoise * 0.24 + z * 0.34 + random() * 0.12),
    );
  }

  return { positions, seeds, sizes, colorMixes, edgeFactors };
}
