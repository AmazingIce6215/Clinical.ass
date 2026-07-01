"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";

type CameraRigProps = {
  target: [number, number, number];
  distance: number;
  enabled: boolean;
};

export function CameraRig({ target, distance, enabled }: CameraRigProps) {
  const { camera } = useThree();
  const lookAtRef = useRef(new THREE.Vector3(...target));
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!enabled) return;

    lookAtRef.current.set(...target);

    const direction = new THREE.Vector3(0, 0.08, 1).normalize();
    const nextPosition = lookAtRef.current.clone().add(direction.multiplyScalar(distance));

    tweenRef.current?.kill();
    tweenRef.current = gsap.to(camera.position, {
      x: nextPosition.x,
      y: nextPosition.y,
      z: nextPosition.z,
      duration: 0.85,
      ease: "power3.inOut",
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [camera, distance, enabled, target]);

  useFrame(() => {
    if (!enabled) return;
    camera.lookAt(lookAtRef.current);
  });

  return null;
}
