"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, Points } from "three";
import { Color, Vector3 } from "three";
import { BRAIN_REGIONS, type BrainRegionId } from "./brain-types";

export function useBrainAnimation(thinkingMode: boolean) {
  const [activeRegion, setActiveRegion] = useState<BrainRegionId>("occipital");
  const [pulseSeed, setPulseSeed] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const region = BRAIN_REGIONS[Math.floor(Math.random() * BRAIN_REGIONS.length)];
      setActiveRegion(region.id);
      setPulseSeed((seed) => seed + 1);
    }, thinkingMode ? 1200 : 2600);

    return () => window.clearInterval(interval);
  }, [thinkingMode]);

  return {
    activeRegion,
    pulseSeed,
    activityScale: thinkingMode ? 1.08 : 1,
    activitySpeed: thinkingMode ? 1.75 : 1,
  };
}

export function useBrainInteraction(params: {
  brainRef: RefObject<Mesh | null>;
  particlesRef: RefObject<Points | null>;
  activeRegion: BrainRegionId;
  pulseSeed: number;
  thinkingMode: boolean;
}) {
  const { brainRef, particlesRef, activeRegion, pulseSeed, thinkingMode } = params;
  const mouseTarget = useMemo(() => new Vector3(), []);
  const hoverTarget = useMemo(() => new Vector3(), []);
  const regionPulse = useMemo(() => new Color(), []);

  useFrame((state, delta) => {
    const brain = brainRef.current;
    if (!brain) return;

    const t = state.clock.elapsedTime;
    const speedMultiplier = thinkingMode ? 1.4 : 1;
    const baseRotationY = t * 0.22 * speedMultiplier;
    const baseRotationX = Math.sin(t * 0.35) * 0.06;
    const breathing = 1 + Math.sin(t * 1.1) * 0.015 + Math.sin(t * 0.18) * 0.01;

    brain.rotation.y = baseRotationY;
    brain.rotation.x = baseRotationX;
    brain.rotation.z = Math.sin(t * 0.16) * 0.04;
    brain.scale.lerp(new Vector3(breathing, breathing, breathing), 0.06);

    const pointerX = state.pointer.x * 0.16;
    const pointerY = state.pointer.y * 0.1;
    mouseTarget.set(pointerY, pointerX, 0);
    brain.rotation.x += mouseTarget.x * delta * 2.5;
    brain.rotation.y += mouseTarget.y * delta * 2.8;

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.04 * speedMultiplier;
      particlesRef.current.rotation.x = Math.sin(t * 0.12) * 0.04;
    }

    hoverTarget.set(
      Math.sin(t * 0.9 + pulseSeed) * 0.015,
      Math.cos(t * 0.7 + pulseSeed) * 0.015,
      Math.sin(t * 0.5 + pulseSeed) * 0.008,
    );

    if (pulseSeed > 0) {
      brain.position.lerp(hoverTarget, 0.05);
    }

    regionPulse.set(activeRegion === "occipital" ? "#43f3ff" : "#7c5cff");
    const material = brain.material as
      | { emissive?: Color; emissiveIntensity?: number }
      | undefined;
    if (material?.emissive) {
      material.emissive.lerp(regionPulse, activeRegion === "occipital" ? 0.09 : 0.06);
      material.emissiveIntensity = 1.1 + Math.sin(t * 2.4) * 0.18;
    }
  });
}
