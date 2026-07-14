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
};

type ParticleHeartCanvasProps = {
  controllerRef: Ref<HeartCanvasController>;
  fallback: ReactNode;
  reducedMotion: boolean;
};

type HeartSceneProps = {
  controllerRef: Ref<HeartCanvasController>;
  particleCount: number;
  pixelRatio: number;
  reducedMotion: boolean;
};

type OrbitTrailData = {
  linePositions: Float32Array;
  lineColors: Float32Array;
  pointPositions: Float32Array;
  pointColors: Float32Array;
};

function orbitColor(x: number) {
  const side = THREE.MathUtils.clamp((x + 1.4) / 2.8, 0, 1);
  const center = 1 - Math.abs(side * 2 - 1);
  return [
    THREE.MathUtils.lerp(0.02, 1, side) + center * 0.1,
    THREE.MathUtils.lerp(0.72, 0.04, side),
    THREE.MathUtils.lerp(1, 0.72, side) + center * 0.08,
  ] as const;
}

function buildOrbitTrailData(lowPower: boolean): OrbitTrailData {
  const loops = lowPower ? 4 : 7;
  const segments = lowPower ? 72 : 112;
  const linePositions: number[] = [];
  const lineColors: number[] = [];
  const pointPositions: number[] = [];
  const pointColors: number[] = [];

  const createPoint = (loop: number, segment: number) => {
    const phase = loop * 1.731;
    const angle = (segment / segments) * Math.PI * 2;
    const radiusX = 1.21 + (loop % 3) * 0.075;
    const radiusY = 0.88 + ((loop + 1) % 3) * 0.065;
    const wobble = Math.sin(angle * (3 + (loop % 2)) + phase) * 0.075;
    const point = new THREE.Vector3(
      Math.cos(angle) * (radiusX + wobble),
      Math.sin(angle) * (radiusY + wobble * 0.55) - 0.02,
      Math.sin(angle * 2 + phase) * (0.24 + loop * 0.018),
    );
    point.applyEuler(
      new THREE.Euler(
        -0.28 + loop * 0.085,
        Math.sin(phase) * 0.28,
        -0.22 + loop * 0.074,
      ),
    );
    return point;
  };

  const pushPoint = (point: THREE.Vector3, positions: number[], colors: number[]) => {
    positions.push(point.x, point.y, point.z);
    colors.push(...orbitColor(point.x));
  };

  for (let loop = 0; loop < loops; loop += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const current = createPoint(loop, segment);
      const next = createPoint(loop, segment + 1);
      pushPoint(current, linePositions, lineColors);
      pushPoint(next, linePositions, lineColors);
      pushPoint(current, pointPositions, pointColors);
    }
  }

  return {
    linePositions: new Float32Array(linePositions),
    lineColors: new Float32Array(lineColors),
    pointPositions: new Float32Array(pointPositions),
    pointColors: new Float32Array(pointColors),
  };
}

function HeartScene({
  controllerRef,
  particleCount,
  pixelRatio,
  reducedMotion,
}: HeartSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const beatTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const emphasisTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const rippleSlotRef = useRef(0);
  const pointerRef = useRef({ clientX: 0, clientY: 0, active: false });
  const mouseStrengthRef = useRef(0);
  const { camera, clock, gl, raycaster } = useThree();
  const particleData = useMemo(
    () => buildHeartParticleData(particleCount),
    [particleCount],
  );
  const orbitData = useMemo(
    () => buildOrbitTrailData(particleCount < 5000),
    [particleCount],
  );
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
      uBeatScale: { value: 1 },
      uMouse: { value: new THREE.Vector3() },
      uMouseStrength: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uRippleOrigins: {
        value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
      },
      uRippleStartTimes: { value: [-100, -100, -100] },
    }),
    [pixelRatio],
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
    const material = materialRef.current;
    if (!material) return;

    beatTimelineRef.current?.pause();
    emphasisTimelineRef.current?.kill();
    emphasisTimelineRef.current = gsap
      .timeline({
        onComplete: () => beatTimelineRef.current?.restart(),
      })
      .to(material.uniforms.uBeatScale, {
        value: reducedMotion ? 1.05 : 1.09,
        duration: 0.11,
        ease: "power2.out",
      })
      .to(material.uniforms.uBeatScale, {
        value: 1,
        duration: 0.17,
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
        const point = projectClientPoint(clientX, clientY);
        const material = materialRef.current;
        if (!point || !material) return;

        const slot = rippleSlotRef.current;
        material.uniforms.uRippleOrigins.value[slot].copy(point);
        material.uniforms.uRippleStartTimes.value[slot] = clock.getElapsedTime();
        rippleSlotRef.current = (slot + 1) % 3;
        playEmphasisBeat();
      },
    }),
    [clock, playEmphasisBeat, projectClientPoint],
  );

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return undefined;

    const beat = gsap
      .timeline({ repeat: -1 })
      .to(material.uniforms.uBeatScale, {
        value: reducedMotion ? 1.032 : 1.062,
        duration: 0.11,
        ease: "power2.out",
      })
      .to(material.uniforms.uBeatScale, {
        value: 1,
        duration: 0.13,
        ease: "power2.inOut",
      })
      .to(material.uniforms.uBeatScale, {
        value: reducedMotion ? 1.018 : 1.034,
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
    return () => {
      emphasisTimelineRef.current?.kill();
    };
  }, []);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    const elapsed = state.clock.getElapsedTime();
    material.uniforms.uTime.value = elapsed;

    const group = groupRef.current;
    if (group) {
      const swaySpeed = reducedMotion ? 0.1 : 0.22;
      const swayAmount = reducedMotion ? 0.035 : 0.12;
      group.rotation.y = -0.06 + Math.sin(elapsed * swaySpeed) * swayAmount;
      group.rotation.x = 0.015 + Math.sin(elapsed * 0.16) * 0.012;
    }

    const orbitGroup = orbitGroupRef.current;
    if (orbitGroup) {
      const orbitSpeed = reducedMotion ? 0.008 : 0.026;
      orbitGroup.rotation.z = elapsed * orbitSpeed;
      orbitGroup.rotation.x = Math.sin(elapsed * 0.13) * 0.055;
      orbitGroup.rotation.y = Math.sin(elapsed * 0.1) * 0.09;
    }

    if (pointerRef.current.active) {
      const projected = projectClientPoint(
        pointerRef.current.clientX,
        pointerRef.current.clientY,
      );
      if (projected) targetMouse.copy(projected);
    }

    const mouseDamping = 1 - Math.exp(-delta * 11);
    const strengthDamping = 1 - Math.exp(-delta * 9);
    smoothedMouse.lerp(targetMouse, mouseDamping);
    const targetStrength = pointerRef.current.active ? 1 : 0;
    mouseStrengthRef.current +=
      (targetStrength - mouseStrengthRef.current) * strengthDamping;
    material.uniforms.uMouse.value.copy(smoothedMouse);
    material.uniforms.uMouseStrength.value = mouseStrengthRef.current;
  });

  return (
    <>
      <group ref={orbitGroupRef}>
        <lineSegments frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[orbitData.linePositions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[orbitData.lineColors, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.36}
            blending={THREE.AdditiveBlending}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[orbitData.pointPositions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[orbitData.pointColors, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            vertexColors
            size={0.018}
            sizeAttenuation
            transparent
            opacity={0.76}
            blending={THREE.AdditiveBlending}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </points>
      </group>
      <group ref={groupRef}>
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
          <bufferAttribute
            attach="attributes-aEdge"
            args={[particleData.edgeFactors, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={particleHeartVertexShader}
          fragmentShader={particleHeartFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      </group>
    </>
  );
}

export function ParticleHeartCanvas({
  controllerRef,
  fallback,
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
      camera={{ position: [0, 0, 4.25], fov: 38, near: 0.1, far: 20 }}
      dpr={[1, profile.maxDpr]}
      fallback={fallback}
      frameloop="always"
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl: renderer }) => renderer.setClearColor(0x000000, 0)}
    >
      <HeartScene
        controllerRef={controllerRef}
        particleCount={profile.particleCount}
        pixelRatio={pixelRatio}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
