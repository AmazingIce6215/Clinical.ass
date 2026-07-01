"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import gsap from "gsap";
import { AnatomyModel } from "./anatomy-model";
import { CameraRig } from "./camera-rig";
import type { AnatomySceneState } from "./anatomy-state";
import type { AnatomyAction } from "./anatomy-state";
import type { AnatomyRegionId } from "./anatomy-regions";

type AnatomySceneProps = {
  state: AnatomySceneState;
  dispatch: React.Dispatch<AnatomyAction>;
  onRevertComplete: () => void;
};

function SceneContents({
  state,
  dispatch,
  onRevertComplete,
}: AnatomySceneProps) {
  const [revealProgress, setRevealProgress] = useState(0);
  const revealTween = useRef<gsap.core.Tween | null>(null);
  const revertStarted = useRef(false);

  useEffect(() => {
    if (state.mode === "selecting") {
      const timer = window.setTimeout(() => dispatch({ type: "SELECT_COMPLETE" }), 650);
      return () => window.clearTimeout(timer);
    }
  }, [dispatch, state.mode]);

  useEffect(() => {
    revealTween.current?.kill();

    if (state.zoomedRegion) {
      revealTween.current = gsap.to(
        { value: 0 },
        {
          value: 1,
          duration: 0.7,
          ease: "power2.out",
          onUpdate() {
            setRevealProgress(this.targets()[0].value);
          },
        },
      );
      return;
    }

    revealTween.current = gsap.to(
      { value: revealProgress },
      {
        value: 0,
        duration: 0.45,
        ease: "power2.inOut",
        onUpdate() {
          setRevealProgress(this.targets()[0].value);
        },
      },
    );
  }, [state.zoomedRegion]);

  useEffect(() => {
    if (state.mode !== "reverting") {
      revertStarted.current = false;
      return;
    }
    if (revertStarted.current) return;
    revertStarted.current = true;

    const timer = window.setTimeout(() => {
      onRevertComplete();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [onRevertComplete, state.mode]);

  const cameraEnabled = state.mode !== "reverting";

  return (
    <>
      <color attach="background" args={["transparent"]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.1} />
      <directionalLight position={[-2, 2.5, -2]} intensity={0.35} />
      <Environment preset="city" environmentIntensity={0.25} />
      <CameraRig
        target={state.cameraTarget}
        distance={state.cameraDistance}
        enabled={cameraEnabled}
      />
      <AnatomyModel
        hoveredRegion={state.hoveredRegion}
        zoomedRegion={state.zoomedRegion}
        revealProgress={revealProgress}
        onRegionHover={(id: AnatomyRegionId) => dispatch({ type: "HOVER_REGION", id })}
        onRegionUnhover={() => dispatch({ type: "UNHOVER_REGION" })}
        onRegionClick={(id: AnatomyRegionId) => dispatch({ type: "CLICK_REGION", id })}
        onBackgroundClick={() => dispatch({ type: "CLICK_MODEL_BG" })}
      />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.28}
        scale={8}
        blur={2.4}
        far={4}
      />
    </>
  );
}

export function AnatomyScene({ state, dispatch, onRevertComplete }: AnatomySceneProps) {
  return (
    <Canvas
      className="anatomy-scene__canvas"
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.05, 3.2], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Suspense fallback={null}>
        <SceneContents state={state} dispatch={dispatch} onRevertComplete={onRevertComplete} />
      </Suspense>
    </Canvas>
  );
}
