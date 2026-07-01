"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Billboard, Float, Html, Line, Points as DreiPoints, PointMaterial, Sparkles } from "@react-three/drei";
import { motion } from "framer-motion";
import { Color, Mesh, Vector3, type Points as ThreePoints } from "three";
import { BRAIN_REGIONS, type BrainRegionId } from "./brain-types";
import { useBrainAnimation, useBrainInteraction } from "./use-brain-animation";
import { cn } from "@/lib/utils";

function makeBrainPoints() {
  const points: [number, number, number][] = [];
  for (let i = 0; i < 1800; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const hemisphere = Math.random() > 0.5 ? 1 : -1;
    const rx = 1.05 + Math.random() * 0.08;
    const ry = 1.35 + Math.random() * 0.08;
    const rz = 1.15 + Math.random() * 0.08;
    const x = Math.cos(theta) * Math.sin(phi) * rx * hemisphere * 0.95;
    const y = Math.cos(phi) * ry;
    const z = Math.sin(theta) * Math.sin(phi) * rz;
    if (y > -1.4 && y < 1.4) points.push([x, y, z]);
  }
  return points;
}

function makeNodeLinks(points: [number, number, number][]) {
  const lines: [number, number, number][][] = [];
  for (let i = 0; i < points.length; i += 1) {
    if (i % 32 !== 0) continue;
    const a = points[i];
    const b = points[(i + 43) % points.length];
    const c = points[(i + 97) % points.length];
    lines.push([a, b]);
    lines.push([a, c]);
  }
  return lines;
}

function RegionPulse({
  active,
  position,
  color,
  label,
  description,
  onHover,
  onClick,
}: {
  active: boolean;
  position: [number, number, number];
  color: string;
  label: string;
  description: string;
  onHover: (active: boolean) => void;
  onClick: () => void;
}) {
  return (
    <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.4}>
      <mesh position={position} onPointerOver={() => onHover(true)} onPointerOut={() => onHover(false)} onClick={onClick}>
        <sphereGeometry args={[active ? 0.12 : 0.08, 20, 20]} />
        <meshStandardMaterial
          color={new Color(color)}
          emissive={new Color(color)}
          emissiveIntensity={active ? 3.2 : 1.2}
          roughness={0.25}
          metalness={0.15}
          transparent
          opacity={0.95}
        />
      </mesh>
      {active && (
        <Billboard position={[position[0], position[1] + 0.28, position[2]]}>
          <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
            <div className="brain-tooltip">
              <p className="brain-tooltip__label">{label}</p>
              <p className="brain-tooltip__desc">{description}</p>
            </div>
          </Html>
        </Billboard>
      )}
    </Float>
  );
}

function BrainScene({
  thinkingMode,
  setActiveRegion,
}: {
  thinkingMode: boolean;
  setActiveRegion: (region: BrainRegionId) => void;
}) {
  const brainRef = useRef<Mesh | null>(null);
  const particlesRef = useRef<ThreePoints | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<BrainRegionId | null>(null);
  const { activeRegion, pulseSeed } = useBrainAnimation(thinkingMode);

  useBrainInteraction({
    brainRef,
    particlesRef,
    activeRegion,
    pulseSeed,
    thinkingMode,
  });

  const pointCloud = useMemo(() => makeBrainPoints(), []);
  const nodeLinks = useMemo(() => makeNodeLinks(pointCloud), [pointCloud]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[3, 4, 5]} intensity={2.7} color="#43f3ff" />
      <pointLight position={[-3, -1, 2]} intensity={1.6} color="#8b5cf6" />
      <directionalLight position={[0, 3, 6]} intensity={1.2} color="#dffaff" />

      <group rotation={[0.14, 0.22, -0.08]}>
        <mesh ref={brainRef}>
          <sphereGeometry args={[1.22, 36, 36]} />
          <meshStandardMaterial
            color="#091827"
            emissive="#143b55"
            emissiveIntensity={1.15}
            roughness={0.42}
            metalness={0.35}
            wireframe
            transparent
            opacity={0.92}
          />
        </mesh>

        <DreiPoints ref={particlesRef} positions={new Float32Array(pointCloud.flat())} stride={3}>
          <PointMaterial
            transparent
            color="#61f0ff"
            size={0.018}
            sizeAttenuation
            depthWrite={false}
            opacity={0.9}
          />
        </DreiPoints>

        {nodeLinks.map(([a, b], index) => (
          <Line
            key={index}
            points={[new Vector3(...a), new Vector3(...b)]}
            color={index % 2 === 0 ? "#43f3ff" : "#8b5cf6"}
            lineWidth={1.1}
            transparent
            opacity={0.24}
          />
        ))}

        {BRAIN_REGIONS.map((region) => (
          <RegionPulse
            key={region.id}
            active={hoveredRegion === region.id || activeRegion === region.id}
            position={region.position}
            color={region.color}
            label={region.label}
            description={region.description}
            onHover={(hovering) => setHoveredRegion(hovering ? region.id : null)}
            onClick={() => {
              setActiveRegion(region.id);
            }}
          />
        ))}
      </group>

      <Sparkles count={90} scale={[6.2, 4.5, 6.2]} size={1.2} speed={0.5} opacity={0.28} color="#7dd3fc" />
      <fog attach="fog" args={["#050913", 5, 13]} />
    </>
  );
}

export function BrainCanvas({
  thinkingMode = false,
  className,
}: {
  thinkingMode?: boolean;
  className?: string;
}) {
  const [activeRegion, setActiveRegion] = useState<BrainRegionId>("occipital");
  const activeModule = BRAIN_REGIONS.find((region) => region.id === activeRegion) ?? BRAIN_REGIONS[3];

  return (
    <div className={cn("brain-canvas-shell", className)}>
      <div className="brain-canvas-shell__glow" />
      <Canvas
        camera={{ position: [0, 0, 5.6], fov: 38 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <BrainScene thinkingMode={thinkingMode} setActiveRegion={setActiveRegion} />
        </Suspense>
      </Canvas>

      <motion.div
        key={activeModule.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="brain-canvas-shell__caption"
      >
        <span className="brain-canvas-shell__eyebrow">AI thinking mode</span>
        <strong>{activeModule.label} active</strong>
        <p>{activeModule.description}</p>
      </motion.div>
    </div>
  );
}
