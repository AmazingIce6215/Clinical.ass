"use client";

import { useMemo, useRef } from "react";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { REGIONS, regionForMeshName, type AnatomyRegionId } from "./anatomy-regions";

type AnatomyModelProps = {
  hoveredRegion: AnatomyRegionId | null;
  zoomedRegion: AnatomyRegionId | null;
  onRegionHover: (id: AnatomyRegionId) => void;
  onRegionUnhover: () => void;
  onRegionClick: (id: AnatomyRegionId) => void;
  onBackgroundClick: () => void;
  revealProgress: number;
};

type RegionMeshProps = {
  name: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isSkin?: boolean;
  hoveredRegion: AnatomyRegionId | null;
  zoomedRegion: AnatomyRegionId | null;
  revealProgress: number;
  onRegionHover: (id: AnatomyRegionId) => void;
  onRegionUnhover: () => void;
  onRegionClick: (id: AnatomyRegionId) => void;
};

const BASE_COLOR = new THREE.Color("#8fa3bc");
const DEEPER_COLOR = new THREE.Color("#c45c5c");
const HIGHLIGHT = new THREE.Color("#5eead4");

function RegionMesh({
  name,
  geometry,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  isSkin = false,
  hoveredRegion,
  zoomedRegion,
  revealProgress,
  onRegionHover,
  onRegionUnhover,
  onRegionClick,
}: RegionMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const region = regionForMeshName(name);
  const regionId = region?.id ?? null;
  const isHovered = regionId !== null && hoveredRegion === regionId;
  const isZoomed = regionId !== null && zoomedRegion === regionId;
  const isSkinLayer = isSkin || name.endsWith("_Skin");
  const isDeeperLayer = !isSkinLayer;

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isDeeperLayer ? DEEPER_COLOR : BASE_COLOR,
      transparent: true,
      opacity: isDeeperLayer ? 0 : isSkinLayer ? 0.92 : 0.85,
      roughness: 0.55,
      metalness: 0.08,
      emissive: new THREE.Color("#000000"),
      emissiveIntensity: 0,
    });
  }, [isDeeperLayer, isSkinLayer]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const targetScale = isHovered && !isZoomed ? 1.03 : 1;
    mesh.scale.set(scale[0] * targetScale, scale[1] * targetScale, scale[2] * targetScale);

    if (isDeeperLayer) {
      const shouldReveal = isZoomed && region?.deeperLayerMeshNames?.includes(name);
      material.opacity = THREE.MathUtils.lerp(material.opacity, shouldReveal ? revealProgress * 0.95 : 0, 0.12);
      material.emissive.set(shouldReveal ? HIGHLIGHT : "#000000");
      material.emissiveIntensity = shouldReveal ? 0.18 : 0;
      return;
    }

    material.opacity = THREE.MathUtils.lerp(
      material.opacity,
      isZoomed ? Math.max(0.18, 0.92 - revealProgress * 0.55) : 0.92,
      0.12,
    );
    material.emissive.set(isHovered ? HIGHLIGHT : "#000000");
    material.emissiveIntensity = isHovered ? 0.35 : 0;
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!regionId || isDeeperLayer) return;
    onRegionHover(regionId);
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!regionId || isDeeperLayer) return;
    onRegionUnhover();
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!regionId || isDeeperLayer) return;
    onRegionClick(regionId);
  };

  return (
    <mesh
      ref={meshRef}
      name={name}
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

export function AnatomyModel({
  hoveredRegion,
  zoomedRegion,
  onRegionHover,
  onRegionUnhover,
  onRegionClick,
  onBackgroundClick,
  revealProgress,
}: AnatomyModelProps) {
  const geometries = useMemo(
    () => ({
      head: new THREE.SphereGeometry(0.18, 24, 24),
      torso: new THREE.CapsuleGeometry(0.24, 0.42, 8, 16),
      abdomen: new THREE.CapsuleGeometry(0.22, 0.24, 8, 16),
      pelvis: new THREE.CapsuleGeometry(0.26, 0.12, 8, 16),
      limb: new THREE.CapsuleGeometry(0.07, 0.34, 6, 12),
      forearm: new THREE.CapsuleGeometry(0.06, 0.28, 6, 12),
      thigh: new THREE.CapsuleGeometry(0.09, 0.42, 6, 12),
      calf: new THREE.CapsuleGeometry(0.07, 0.36, 6, 12),
      brain: new THREE.SphereGeometry(0.11, 16, 16),
      heart: new THREE.SphereGeometry(0.08, 16, 16),
      lung: new THREE.SphereGeometry(0.09, 12, 12),
      rib: new THREE.TorusGeometry(0.16, 0.025, 8, 24),
      organ: new THREE.SphereGeometry(0.07, 12, 12),
      bone: new THREE.CylinderGeometry(0.035, 0.035, 0.34, 10),
    }),
    [],
  );

  return (
    <group
      position={[0, 0.05, 0]}
      onPointerMissed={(event) => {
        if (event.type === "click") onBackgroundClick();
      }}
    >
      {REGIONS.flatMap((region) => {
        const meshes: Array<{
          name: string;
          geometry: THREE.BufferGeometry;
          position: [number, number, number];
          rotation?: [number, number, number];
          scale?: [number, number, number];
          isSkin?: boolean;
        }> = [];

        switch (region.id) {
          case "head":
            meshes.push(
              { name: "Head_Skin", geometry: geometries.head, position: [0, 1.62, 0], isSkin: true },
              { name: "Head_Muscle", geometry: geometries.head, position: [0, 1.62, 0], scale: [0.92, 0.92, 0.92] },
              { name: "Brain", geometry: geometries.brain, position: [0, 1.64, 0.02] },
            );
            break;
          case "thorax":
            meshes.push(
              { name: "Thorax_Skin", geometry: geometries.torso, position: [0, 1.35, 0], isSkin: true },
              { name: "Thorax_Muscle", geometry: geometries.torso, position: [0, 1.35, 0], scale: [0.94, 0.94, 0.94] },
              { name: "Ribcage", geometry: geometries.rib, position: [0, 1.36, 0], rotation: [Math.PI / 2, 0, 0] },
              { name: "Heart", geometry: geometries.heart, position: [-0.04, 1.34, 0.08] },
              { name: "Lungs", geometry: geometries.lung, position: [0.1, 1.38, 0.02], scale: [1.1, 0.85, 0.8] },
            );
            break;
          case "abdomen":
            meshes.push(
              { name: "Abdomen_Skin", geometry: geometries.abdomen, position: [0, 0.98, 0], isSkin: true },
              { name: "Abdomen_Muscle", geometry: geometries.abdomen, position: [0, 0.98, 0], scale: [0.93, 0.93, 0.93] },
              { name: "Stomach", geometry: geometries.organ, position: [-0.03, 1.02, 0.05] },
              { name: "Intestines", geometry: geometries.organ, position: [0.04, 0.92, 0.04], scale: [1.2, 0.8, 0.9] },
            );
            break;
          case "pelvis":
            meshes.push(
              { name: "Pelvis_Skin", geometry: geometries.pelvis, position: [0, 0.68, 0], isSkin: true },
              { name: "Pelvis_Muscle", geometry: geometries.pelvis, position: [0, 0.68, 0], scale: [0.95, 0.95, 0.95] },
              { name: "Pelvis_Bone", geometry: geometries.bone, position: [0, 0.68, 0], rotation: [0, 0, Math.PI / 2], scale: [1, 1, 0.7] },
            );
            break;
          case "left_arm":
            meshes.push(
              { name: "LeftArm_Skin", geometry: geometries.limb, position: [-0.34, 1.28, 0], rotation: [0, 0, 0.28], isSkin: true },
              { name: "LeftArm_Muscle", geometry: geometries.forearm, position: [-0.48, 1.02, 0], rotation: [0, 0, 0.18] },
              { name: "LeftArm_Bone", geometry: geometries.bone, position: [-0.41, 1.15, 0], rotation: [0, 0, 0.24] },
            );
            break;
          case "right_arm":
            meshes.push(
              { name: "RightArm_Skin", geometry: geometries.limb, position: [0.34, 1.28, 0], rotation: [0, 0, -0.28], isSkin: true },
              { name: "RightArm_Muscle", geometry: geometries.forearm, position: [0.48, 1.02, 0], rotation: [0, 0, -0.18] },
              { name: "RightArm_Bone", geometry: geometries.bone, position: [0.41, 1.15, 0], rotation: [0, 0, -0.24] },
            );
            break;
          case "left_leg":
            meshes.push(
              { name: "LeftLeg_Skin", geometry: geometries.thigh, position: [-0.14, 0.42, 0], isSkin: true },
              { name: "LeftLeg_Muscle", geometry: geometries.calf, position: [-0.14, 0.12, 0] },
              { name: "LeftLeg_Bone", geometry: geometries.bone, position: [-0.14, 0.3, 0] },
            );
            break;
          case "right_leg":
            meshes.push(
              { name: "RightLeg_Skin", geometry: geometries.thigh, position: [0.14, 0.42, 0], isSkin: true },
              { name: "RightLeg_Muscle", geometry: geometries.calf, position: [0.14, 0.12, 0] },
              { name: "RightLeg_Bone", geometry: geometries.bone, position: [0.14, 0.3, 0] },
            );
            break;
        }

        return meshes.map((mesh) => (
          <RegionMesh
            key={mesh.name}
            {...mesh}
            hoveredRegion={hoveredRegion}
            zoomedRegion={zoomedRegion}
            revealProgress={revealProgress}
            onRegionHover={onRegionHover}
            onRegionUnhover={onRegionUnhover}
            onRegionClick={onRegionClick}
          />
        ));
      })}
    </group>
  );
}
