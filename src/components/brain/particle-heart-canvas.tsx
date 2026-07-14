"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
  type RefObject,
} from "react";
import { createNoise3D } from "simplex-noise";
import * as THREE from "three";
import {
  buildHeartParticleData,
  getHeartPerformanceProfile,
  type HeartParticleData,
} from "@/components/brain/heart-particle-geometry";
import {
  particleHeartFragmentShader,
  particleHeartVertexShader,
  tendrilFragmentShader,
  tendrilVertexShader,
} from "@/components/brain/particle-heart-shaders";

export type HeartCanvasController = {
  pointerMove: (clientX: number, clientY: number) => void;
  pointerLeave: () => void;
  rippleAt: (clientX: number, clientY: number) => void;
  dissolveAt: (clientX: number, clientY: number) => void;
  reform: () => void;
};

type ParticleHeartCanvasProps = {
  controllerRef: Ref<HeartCanvasController>;
  reducedMotion: boolean;
  onReadyChange: (ready: boolean) => void;
};

type HeartSceneProps = {
  controllerRef: Ref<HeartCanvasController>;
  particleCount: number;
  pixelRatio: number;
  lowPower: boolean;
  reducedMotion: boolean;
};

type TendrilData = {
  positions: Float32Array;
  progress: Float32Array;
  phases: Float32Array;
  sizes: Float32Array;
  linePositions: Float32Array;
};

type HeartLayerProps = {
  data: HeartParticleData;
  materialRef: RefObject<THREE.ShaderMaterial | null>;
  uniforms: Record<string, THREE.IUniform>;
  blending: THREE.Blending;
};

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
  return new THREE.Vector3(
    16 * sinT * sinT * sinT * 0.073,
    (13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)) *
      0.073 +
      0.09,
    0,
  );
}

function buildTendrilData(lowPower: boolean): TendrilData {
  const random = mulberry32(0x54454e44);
  const noise3D = createNoise3D(random);
  const pathCount = lowPower ? 4 : 6;
  const samplesPerPath = lowPower ? 68 : 104;
  const startParameters = [0.18, 0.48, 0.82, 1.16, 1.52, 1.84];
  const positions: number[] = [];
  const progress: number[] = [];
  const phases: number[] = [];
  const sizes: number[] = [];
  const linePositions: number[] = [];

  for (let pathIndex = 0; pathIndex < pathCount; pathIndex += 1) {
    const startT = startParameters[pathIndex] * Math.PI;
    const start = heartBoundary(startT);
    const outward = new THREE.Vector3(start.x, start.y - 0.02, 0).normalize();
    const tangent = new THREE.Vector3(-outward.y, outward.x, 0);
    const controls: THREE.Vector3[] = [];

    for (let controlIndex = 0; controlIndex < 7; controlIndex += 1) {
      const distance = controlIndex * (0.16 + pathIndex * 0.006);
      const curl = noise3D(pathIndex * 0.71, controlIndex * 0.43, 0.27) *
        (0.09 + controlIndex * 0.035);
      const depth = noise3D(pathIndex * 0.37, controlIndex * 0.29, 1.17) *
        (0.08 + controlIndex * 0.045);
      controls.push(
        start
          .clone()
          .addScaledVector(outward, distance)
          .addScaledVector(tangent, curl)
          .add(new THREE.Vector3(0, 0, depth)),
      );
    }

    const curve = new THREE.CatmullRomCurve3(controls, false, "catmullrom", 0.46);
    let previous = curve.getPoint(0);
    for (let sample = 0; sample < samplesPerPath; sample += 1) {
      const t = sample / Math.max(1, samplesPerPath - 1);
      const point = curve.getPoint(t);
      positions.push(point.x, point.y, point.z);
      progress.push(t);
      phases.push(pathIndex / pathCount);
      sizes.push(0.7 + random() * 0.8);

      if (sample > 0) {
        linePositions.push(
          previous.x,
          previous.y,
          previous.z,
          point.x,
          point.y,
          point.z,
        );
      }
      previous = point;
    }
  }

  return {
    positions: new Float32Array(positions),
    progress: new Float32Array(progress),
    phases: new Float32Array(phases),
    sizes: new Float32Array(sizes),
    linePositions: new Float32Array(linePositions),
  };
}

function createHaloTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(96, 96, 4, 96, 96, 96);
  gradient.addColorStop(0, "rgba(70, 0, 13, 0.97)");
  gradient.addColorStop(0.52, "rgba(44, 0, 9, 0.75)");
  gradient.addColorStop(0.76, "rgba(28, 0, 6, 0.24)");
  gradient.addColorStop(0.92, "rgba(5, 0, 2, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 192, 192);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function HeartParticleLayer({
  data,
  materialRef,
  uniforms,
  blending,
}: HeartLayerProps) {
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute
          attach="attributes-aBasePosition"
          args={[data.positions, 3]}
        />
        <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seeds, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[data.phases, 1]} />
        <bufferAttribute
          attach="attributes-aFrequency"
          args={[data.frequencies, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={particleHeartVertexShader}
        fragmentShader={particleHeartFragmentShader}
        transparent
        blending={blending}
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

type HeartAnimationState = {
  beatScale: number;
  dissolve: number;
  opacity: number;
};

function createHeartUniforms(pixelRatio: number, intensity: number, rim: number) {
  return {
    uTime: { value: 0 },
    uBeatScale: { value: 1 },
    uMouse: { value: new THREE.Vector3() },
    uMouseStrength: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uOpacity: { value: 1 },
    uDissolve: { value: 0 },
    uDissolveOrigin: { value: new THREE.Vector3() },
    uRippleOrigins: {
      value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    },
    uRippleStartTimes: { value: [-100, -100, -100] },
    uIntensity: { value: intensity },
    uRim: { value: rim },
  };
}

function syncHeartMaterial(
  material: THREE.ShaderMaterial | null,
  elapsed: number,
  animation: HeartAnimationState,
  mouse: THREE.Vector3,
  mouseStrength: number,
  rippleOrigins: THREE.Vector3[],
  rippleStartTimes: number[],
  dissolveOrigin: THREE.Vector3,
) {
  if (!material) return;
  const uniforms = material.uniforms;
  uniforms.uTime.value = elapsed;
  uniforms.uBeatScale.value = animation.beatScale;
  uniforms.uMouse.value.copy(mouse);
  uniforms.uMouseStrength.value = mouseStrength;
  uniforms.uOpacity.value = animation.opacity;
  uniforms.uDissolve.value = animation.dissolve;
  uniforms.uDissolveOrigin.value.copy(dissolveOrigin);
  for (let index = 0; index < 3; index += 1) {
    uniforms.uRippleOrigins.value[index].copy(rippleOrigins[index]);
    uniforms.uRippleStartTimes.value[index] = rippleStartTimes[index];
  }
}

function HeartScene({
  controllerRef,
  particleCount,
  pixelRatio,
  lowPower,
  reducedMotion,
}: HeartSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const interiorMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const rimMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const haloMaterialRef = useRef<THREE.SpriteMaterial>(null);
  const tendrilLineMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const tendrilMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const beatTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const emphasisTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const dissolveTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const rippleSlotRef = useRef(0);
  const pointerRef = useRef({ clientX: 0, clientY: 0, active: false });
  const mouseStrengthRef = useRef(0);
  const animationStateRef = useRef<HeartAnimationState>({
    beatScale: 1,
    dissolve: 0,
    opacity: 1,
  });
  const rippleOriginsRef = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const rippleStartTimesRef = useRef([-100, -100, -100]);
  const dissolveOriginRef = useRef(new THREE.Vector3());
  const { camera, clock, gl, raycaster } = useThree();

  const interiorCount = Math.round(particleCount * 0.42);
  const rimCount = particleCount - interiorCount;
  const interiorData = useMemo(
    () => buildHeartParticleData(interiorCount, 0x48454152, "interior"),
    [interiorCount],
  );
  const rimData = useMemo(
    () => buildHeartParticleData(rimCount, 0x52494d21, "rim"),
    [rimCount],
  );
  const tendrilData = useMemo(() => buildTendrilData(lowPower), [lowPower]);
  const haloTexture = useMemo(() => createHaloTexture(), []);
  const interactionPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    [],
  );
  const pointerNdc = useMemo(() => new THREE.Vector2(), []);
  const planeHit = useMemo(() => new THREE.Vector3(), []);
  const localHit = useMemo(() => new THREE.Vector3(), []);
  const targetMouse = useMemo(() => new THREE.Vector3(), []);
  const smoothedMouse = useMemo(() => new THREE.Vector3(), []);

  const interiorUniforms = useMemo(
    () => createHeartUniforms(pixelRatio, 0.9, 0),
    [pixelRatio],
  );
  const rimUniforms = useMemo(
    () => createHeartUniforms(pixelRatio, 1.42, 1),
    [pixelRatio],
  );
  const tendrilUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uDissolve: { value: 0 },
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
    beatTimelineRef.current?.pause();
    emphasisTimelineRef.current?.kill();
    emphasisTimelineRef.current = gsap
      .timeline({ onComplete: () => beatTimelineRef.current?.restart() })
      .to(animationStateRef.current, {
        beatScale: reducedMotion ? 1.045 : 1.09,
        duration: 0.11,
        ease: "power2.out",
      })
      .to(animationStateRef.current, {
        beatScale: 1,
        duration: 0.17,
        ease: "power2.inOut",
      });
  }, [reducedMotion]);

  useImperativeHandle(
    controllerRef,
    () => ({
      pointerMove(clientX, clientY) {
        pointerRef.current = { clientX, clientY, active: true };
      },
      pointerLeave() {
        pointerRef.current.active = false;
      },
      rippleAt(clientX, clientY) {
        if (animationStateRef.current.dissolve > 0.05) return;
        const point = projectClientPoint(clientX, clientY);
        if (!point) return;
        const slot = rippleSlotRef.current;
        rippleOriginsRef.current[slot].copy(point);
        rippleStartTimesRef.current[slot] = clock.getElapsedTime();
        rippleSlotRef.current = (slot + 1) % 3;
        playEmphasisBeat();
      },
      dissolveAt(clientX, clientY) {
        const point = projectClientPoint(clientX, clientY);
        if (point) dissolveOriginRef.current.copy(point);
        else dissolveOriginRef.current.set(0, 0, 0);
        rippleStartTimesRef.current.fill(-100);
        beatTimelineRef.current?.pause();
        emphasisTimelineRef.current?.kill();
        dissolveTimelineRef.current?.kill();
        dissolveTimelineRef.current = gsap
          .timeline()
          .to(
            animationStateRef.current,
            {
              dissolve: 1,
              duration: reducedMotion ? 0.32 : 0.9,
              ease: "power2.out",
            },
            0,
          )
          .to(
            animationStateRef.current,
            {
              opacity: 0,
              duration: reducedMotion ? 0.26 : 0.82,
              ease: "power2.out",
            },
            0,
          );
      },
      reform() {
        dissolveTimelineRef.current?.kill();
        dissolveTimelineRef.current = gsap
          .timeline({ onComplete: () => beatTimelineRef.current?.restart() })
          .to(
            animationStateRef.current,
            {
              dissolve: 0,
              duration: reducedMotion ? 0.3 : 0.86,
              ease: "power2.inOut",
            },
            0,
          )
          .to(
            animationStateRef.current,
            {
              opacity: 1,
              duration: reducedMotion ? 0.24 : 0.76,
              ease: "power2.out",
            },
            reducedMotion ? 0 : 0.08,
          );
      },
    }),
    [clock, playEmphasisBeat, projectClientPoint, reducedMotion],
  );

  useEffect(() => {
    const beat = gsap
      .timeline({ repeat: -1 })
      .to(animationStateRef.current, {
        beatScale: reducedMotion ? 1.035 : 1.07,
        duration: 0.11,
        ease: "power2.out",
      })
      .to(animationStateRef.current, {
        beatScale: 1,
        duration: 0.13,
        ease: "power1.inOut",
      })
      .to(animationStateRef.current, {
        beatScale: reducedMotion ? 1.018 : 1.035,
        duration: 0.1,
        ease: "power2.out",
      })
      .to(animationStateRef.current, {
        beatScale: 1,
        duration: 0.12,
        ease: "power1.inOut",
      })
      .to({}, { duration: 0.7 });
    beatTimelineRef.current = beat;

    return () => {
      beat.kill();
      emphasisTimelineRef.current?.kill();
      dissolveTimelineRef.current?.kill();
      beatTimelineRef.current = null;
    };
  }, [reducedMotion]);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    const animation = animationStateRef.current;

    if (pointerRef.current.active && animation.dissolve < 0.05) {
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
      pointerRef.current.active && animation.dissolve < 0.05 ? 1 : 0;
    mouseStrengthRef.current +=
      (targetStrength - mouseStrengthRef.current) * strengthDamping;

    if (groupRef.current && animation.dissolve < 0.05) {
      const yawAmplitude = reducedMotion ? 0.06 : 0.16;
      const yawFrequency = reducedMotion ? 0.12 : 0.31;
      groupRef.current.rotation.y =
        Math.sin(elapsed * yawFrequency) * yawAmplitude;
    }

    syncHeartMaterial(
      interiorMaterialRef.current,
      elapsed,
      animation,
      smoothedMouse,
      mouseStrengthRef.current,
      rippleOriginsRef.current,
      rippleStartTimesRef.current,
      dissolveOriginRef.current,
    );
    syncHeartMaterial(
      rimMaterialRef.current,
      elapsed,
      animation,
      smoothedMouse,
      mouseStrengthRef.current,
      rippleOriginsRef.current,
      rippleStartTimesRef.current,
      dissolveOriginRef.current,
    );
    if (tendrilMaterialRef.current) {
      tendrilMaterialRef.current.uniforms.uTime.value = elapsed;
      tendrilMaterialRef.current.uniforms.uDissolve.value = animation.dissolve;
    }

    if (haloMaterialRef.current) {
      haloMaterialRef.current.opacity = 0.92 * (1 - animation.dissolve);
    }
    if (tendrilLineMaterialRef.current) {
      tendrilLineMaterialRef.current.opacity = 0.18 * (1 - animation.dissolve);
    }
  });

  return (
    <>
      {haloTexture ? (
        <sprite position={[0, 0, -0.72]} scale={[3.0, 2.65, 1]}>
          <spriteMaterial
            ref={haloMaterialRef}
            map={haloTexture}
            transparent
            opacity={0.92}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ) : null}

      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[tendrilData.linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={tendrilLineMaterialRef}
          color="#b71c2e"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[tendrilData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aProgress"
            args={[tendrilData.progress, 1]}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            args={[tendrilData.phases, 1]}
          />
          <bufferAttribute attach="attributes-aSize" args={[tendrilData.sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={tendrilMaterialRef}
          uniforms={tendrilUniforms}
          vertexShader={tendrilVertexShader}
          fragmentShader={tendrilFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthTest
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      <group ref={groupRef}>
        <HeartParticleLayer
          data={interiorData}
          materialRef={interiorMaterialRef}
          uniforms={interiorUniforms}
          blending={THREE.NormalBlending}
        />
        <HeartParticleLayer
          data={rimData}
          materialRef={rimMaterialRef}
          uniforms={rimUniforms}
          blending={THREE.AdditiveBlending}
        />
      </group>
    </>
  );
}

function CanvasReadiness({
  onReadyChange,
}: Pick<ParticleHeartCanvasProps, "onReadyChange">) {
  const { gl } = useThree();
  const renderedFramesRef = useRef(0);
  const readyRef = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const markUnavailable = () => {
      renderedFramesRef.current = 0;
      readyRef.current = false;
      onReadyChange(false);
    };
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      markUnavailable();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", markUnavailable);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", markUnavailable);
    };
  }, [gl, onReadyChange]);

  useFrame(() => {
    if (readyRef.current) return;

    if (renderedFramesRef.current === 0) {
      renderedFramesRef.current = 1;
      return;
    }

    readyRef.current = true;
    onReadyChange(true);
  });

  return null;
}

export function ParticleHeartCanvas({
  controllerRef,
  reducedMotion,
  onReadyChange,
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
      fallback={null}
      frameloop="always"
      gl={{
        alpha: true,
        antialias: !profile.lowPower,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl: renderer }) => {
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
      }}
    >
      <CanvasReadiness onReadyChange={onReadyChange} />
      <HeartScene
        controllerRef={controllerRef}
        particleCount={profile.particleCount}
        pixelRatio={pixelRatio}
        lowPower={profile.lowPower}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
