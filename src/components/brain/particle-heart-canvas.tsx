"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
  type Ref,
} from "react";
import * as THREE from "three";
import {
  buildHeartParticleData,
  getHeartPerformanceProfile,
} from "@/components/brain/heart-particle-geometry";
import {
  particleHeartFragmentShader,
  particleHeartVertexShader,
} from "@/components/brain/particle-heart-shaders";

export type HeartCanvasController = {
  pointerMove: (clientX: number, clientY: number) => void;
  pointerLeave: () => void;
  rippleAt: (clientX: number, clientY: number) => void;
  setDissolveOrigin: (clientX?: number, clientY?: number) => void;
};

type ParticleHeartCanvasProps = {
  controllerRef: Ref<HeartCanvasController>;
  fallback: ReactNode;
  mode: "heart" | "case";
  reducedMotion: boolean;
};

type HeartSceneProps = {
  controllerRef: Ref<HeartCanvasController>;
  mode: "heart" | "case";
  particleCount: number;
  pixelRatio: number;
  reducedMotion: boolean;
};

function createRadialSpriteTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const normalizedX = (x + 0.5) / size - 0.5;
      const normalizedY = (y + 0.5) / size - 0.5;
      const distance = Math.sqrt(
        normalizedX * normalizedX + normalizedY * normalizedY,
      );
      const normalizedDistance = Math.min(1, distance / 0.5);
      const alpha = Math.pow(1 - normalizedDistance, 1.7);
      const offset = (y * size + x) * 4;

      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(alpha * 255);
    }
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.needsUpdate = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function HeartScene({
  controllerRef,
  mode,
  particleCount,
  pixelRatio,
  reducedMotion,
}: HeartSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const beatTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const emphasisTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const rippleSlotRef = useRef(0);
  const pausedRef = useRef(false);
  const initialModeRef = useRef(true);
  const pointerRef = useRef({ clientX: 0, clientY: 0, active: false });
  const mouseStrengthRef = useRef(0);
  const { camera, clock, gl, raycaster } = useThree();
  const particleData = useMemo(
    () => buildHeartParticleData(particleCount),
    [particleCount],
  );
  const spriteTexture = useMemo(() => createRadialSpriteTexture(), []);
  const interactionPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    [],
  );
  const pointerNdc = useMemo(() => new THREE.Vector2(), []);
  const planeHit = useMemo(() => new THREE.Vector3(), []);
  const localHit = useMemo(() => new THREE.Vector3(), []);
  const targetMouse = useMemo(() => new THREE.Vector3(), []);
  const smoothedMouse = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uBeatScale: { value: 1 },
      uMouse: { value: new THREE.Vector3() },
      uMouseStrength: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uSprite: { value: spriteTexture },
      uRippleOrigins: {
        value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
      },
      uRippleStartTimes: { value: [-100, -100, -100] },
      uDissolve: { value: 0 },
      uDissolveOrigin: { value: new THREE.Vector3() },
    }),
    [pixelRatio, spriteTexture],
  );

  const projectClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const group = groupRef.current;
      if (!group) return null;

      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      pointerNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointerNdc, camera);
      if (!raycaster.ray.intersectPlane(interactionPlane, planeHit)) return null;

      group.updateWorldMatrix(true, false);
      localHit.copy(planeHit);
      group.worldToLocal(localHit);
      return localHit;
    },
    [camera, gl, interactionPlane, localHit, planeHit, pointerNdc, raycaster],
  );

  const playEmphasisBeat = useCallback(() => {
    if (reducedMotion || pausedRef.current) return;
    const material = materialRef.current;
    if (!material) return;

    beatTimelineRef.current?.pause();
    emphasisTimelineRef.current?.kill();
    emphasisTimelineRef.current = gsap
      .timeline({
        onComplete: () => {
          if (!pausedRef.current) beatTimelineRef.current?.restart();
        },
      })
      .to(material.uniforms.uBeatScale, {
        value: 1.08,
        duration: 0.12,
        ease: "power2.out",
      })
      .to(material.uniforms.uBeatScale, {
        value: 1,
        duration: 0.18,
        ease: "power2.inOut",
      });
  }, [reducedMotion]);

  useImperativeHandle(
    controllerRef,
    () => ({
      pointerMove(clientX, clientY) {
        pointerRef.current.clientX = clientX;
        pointerRef.current.clientY = clientY;
        pointerRef.current.active = true;
      },
      pointerLeave() {
        pointerRef.current.active = false;
      },
      rippleAt(clientX, clientY) {
        if (reducedMotion || pausedRef.current) return;
        const point = projectClientPoint(clientX, clientY);
        const material = materialRef.current;
        if (!point || !material) return;

        const slot = rippleSlotRef.current;
        material.uniforms.uRippleOrigins.value[slot].copy(point);
        material.uniforms.uRippleStartTimes.value[slot] = clock.getElapsedTime();
        rippleSlotRef.current = (slot + 1) % 3;
        playEmphasisBeat();
      },
      setDissolveOrigin(clientX, clientY) {
        const material = materialRef.current;
        if (!material) return;
        const point =
          clientX == null || clientY == null
            ? null
            : projectClientPoint(clientX, clientY);
        material.uniforms.uDissolveOrigin.value.copy(
          point ?? targetMouse.set(0, 0, 0),
        );
        material.uniforms.uRippleStartTimes.value.fill(-100);
      },
    }),
    [
      clock,
      playEmphasisBeat,
      projectClientPoint,
      reducedMotion,
      targetMouse,
    ],
  );

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return undefined;

    if (reducedMotion) {
      material.uniforms.uBeatScale.value = 1;
      return undefined;
    }

    const beat = gsap
      .timeline({ repeat: -1 })
      .to(material.uniforms.uBeatScale, {
        value: 1.055,
        duration: 0.11,
        ease: "power2.out",
      })
      .to(material.uniforms.uBeatScale, {
        value: 1,
        duration: 0.13,
        ease: "power2.inOut",
      })
      .to(material.uniforms.uBeatScale, {
        value: 1.032,
        duration: 0.1,
        ease: "power2.out",
      })
      .to(material.uniforms.uBeatScale, {
        value: 1,
        duration: 0.14,
        ease: "power2.inOut",
      })
      .to({}, { duration: 0.56 });

    beatTimelineRef.current = beat;
    return () => {
      beat.kill();
      beatTimelineRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (initialModeRef.current) {
      initialModeRef.current = false;
      if (mode === "heart") return undefined;

      const initialMaterial = materialRef.current;
      if (!initialMaterial) return undefined;
      pausedRef.current = true;
      beatTimelineRef.current?.pause();
      initialMaterial.uniforms.uOpacity.value = 0;
      initialMaterial.uniforms.uDissolve.value = reducedMotion ? 0 : 1;
      return undefined;
    }

    transitionTimelineRef.current?.kill();
    emphasisTimelineRef.current?.kill();
    const material = materialRef.current;
    if (!material) return undefined;
    const duration = reducedMotion ? 0.2 : 0.9;

    if (mode === "case") {
      pausedRef.current = true;
      beatTimelineRef.current?.pause();
      material.uniforms.uRippleStartTimes.value.fill(-100);
      transitionTimelineRef.current = gsap
        .timeline()
        .to(
          material.uniforms.uDissolve,
          {
            value: reducedMotion ? 0 : 1,
            duration,
            ease: "power2.out",
          },
          0,
        )
        .to(
          material.uniforms.uOpacity,
          { value: 0, duration, ease: "power2.out" },
          0,
        );
    } else {
      transitionTimelineRef.current = gsap
        .timeline({
          onComplete: () => {
            pausedRef.current = false;
            if (!reducedMotion) beatTimelineRef.current?.restart();
          },
        })
        .to(
          material.uniforms.uOpacity,
          { value: 1, duration, ease: "power2.inOut" },
          0,
        )
        .to(
          material.uniforms.uDissolve,
          { value: 0, duration, ease: "power2.inOut" },
          0,
        );
    }

    return () => {
      transitionTimelineRef.current?.kill();
    };
  }, [mode, reducedMotion]);

  useEffect(() => {
    return () => {
      emphasisTimelineRef.current?.kill();
      transitionTimelineRef.current?.kill();
      spriteTexture.dispose();
    };
  }, [spriteTexture]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = state.clock.getElapsedTime();

    const group = groupRef.current;
    if (group && !pausedRef.current) {
      group.rotation.y += delta * (reducedMotion ? 0.012 : 0.05);
    }

    if (!reducedMotion && mode === "heart" && pointerRef.current.active) {
      const projected = projectClientPoint(
        pointerRef.current.clientX,
        pointerRef.current.clientY,
      );
      if (projected) targetMouse.copy(projected);
    }

    const mouseDamping = 1 - Math.exp(-delta * 11);
    const strengthDamping = 1 - Math.exp(-delta * 9);
    smoothedMouse.lerp(targetMouse, mouseDamping);
    const targetStrength =
      !reducedMotion && mode === "heart" && pointerRef.current.active ? 1 : 0;
    mouseStrengthRef.current +=
      (targetStrength - mouseStrengthRef.current) * strengthDamping;
    material.uniforms.uMouse.value.copy(smoothedMouse);
    material.uniforms.uMouseStrength.value = mouseStrengthRef.current;
  });

  return (
    <group ref={groupRef} rotation={[0.02, -0.18, 0]}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSeed"
            args={[particleData.seeds, 1]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[particleData.sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aColorMix"
            args={[particleData.colorMixes, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={particleHeartVertexShader}
          fragmentShader={particleHeartFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthTest
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

export function ParticleHeartCanvas({
  controllerRef,
  fallback,
  mode,
  reducedMotion,
}: ParticleHeartCanvasProps) {
  const profile = useMemo(
    () =>
      getHeartPerformanceProfile({
        width: window.innerWidth,
        devicePixelRatio: window.devicePixelRatio || 1,
        hardwareConcurrency: navigator.hardwareConcurrency,
        coarsePointer: window.matchMedia("(pointer: coarse)").matches,
      }),
    [],
  );
  const pixelRatio = Math.min(
    window.devicePixelRatio || 1,
    profile.maxDpr,
  );

  return (
    <Canvas
      className="heart-particle-canvas"
      camera={{ position: [0, 0, 4.25], fov: 39, near: 0.1, far: 20 }}
      dpr={[1, profile.maxDpr]}
      fallback={fallback}
      frameloop="always"
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl: renderer }) => renderer.setClearColor(0x000000, 0)}
    >
      <HeartScene
        controllerRef={controllerRef}
        mode={mode}
        particleCount={profile.particleCount}
        pixelRatio={pixelRatio}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
