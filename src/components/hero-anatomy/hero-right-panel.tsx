"use client";

import dynamic from "next/dynamic";
import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { WalkingCrowd } from "./walking-crowd";
import { anatomyReducer, initialAnatomyState } from "./anatomy-state";

const AnatomyScene = dynamic(
  () => import("./anatomy-scene").then((mod) => mod.AnatomyScene),
  {
    ssr: false,
    loading: () => (
      <div className="anatomy-scene__loading">
        <div className="anatomy-scene__loading-orbit" />
        <p className="text-sm text-muted">Loading anatomy model…</p>
      </div>
    ),
  },
);

function usePrefersSimpleScene() {
  const [simple, setSimple] = useState(false);

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 1023px)").matches;
    const lowPower = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
    setSimple(coarsePointer || narrow || lowPower);
  }, []);

  return simple;
}

function MobileFallback({ onActivate }: { onActivate: () => void }) {
  return (
    <button type="button" className="anatomy-fallback" onClick={onActivate}>
      <div className="anatomy-fallback__figure" aria-hidden="true" />
      <p className="shell-kicker mb-1">Interactive anatomy</p>
      <p className="text-sm text-muted">Tap to explore regions on desktop, or open the full model here.</p>
    </button>
  );
}

export function HeroRightPanel() {
  const reduceMotion = useReducedMotion();
  const prefersSimple = usePrefersSimpleScene();
  const [forceFullScene, setForceFullScene] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(anatomyReducer, initialAnatomyState);

  const showSimple = prefersSimple && !forceFullScene;
  const showCrowd = state.mode === "idle" && !reduceMotion;
  const showAnatomy = state.mode !== "idle" && sceneReady && !reduceMotion;

  useEffect(() => {
    if (reduceMotion || showSimple) return;

    const node = panelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSceneReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion, showSimple]);

  useEffect(() => {
    if (state.mode !== "idle") setSceneReady(true);
  }, [state.mode]);

  const handlePointerLeave = () => {
    if (state.mode === "anatomy_default" || state.mode === "anatomy_hover" || state.mode === "anatomy_zoomed") {
      dispatch({ type: "REVERT" });
    }
  };

  return (
    <GlassCard className="glass-card--hero hero-right-panel overflow-hidden p-0">
      <div
        ref={panelRef}
        className={cn("hero-right-panel__stage", showSimple && "hero-right-panel__stage--simple")}
        onPointerLeave={handlePointerLeave}
      >
        {reduceMotion ? (
          <div className="hero-right-panel__static">
            <p className="shell-kicker mb-2">Clinical anatomy preview</p>
            <p className="max-w-xs text-sm leading-6 text-muted">
              Explore layered human anatomy from the homepage on desktop for the full interactive walkthrough.
            </p>
          </div>
        ) : showSimple ? (
          <MobileFallback onActivate={() => setForceFullScene(true)} />
        ) : (
          <>
            <AnimatePresence mode="wait">
              {showCrowd ? (
                <motion.div
                  key="crowd"
                  className="hero-right-panel__layer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <WalkingCrowd onSelectFigure={(id) => dispatch({ type: "SELECT", id })} />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {showAnatomy ? (
              <motion.div
                className="hero-right-panel__layer hero-right-panel__layer--anatomy"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <AnatomyScene
                  state={state}
                  dispatch={dispatch}
                  onRevertComplete={() => dispatch({ type: "REVERT_COMPLETE" })}
                />
                <div className="anatomy-scene__chrome">
                  <p className="shell-kicker">Layered anatomy</p>
                  <p className="text-xs text-muted">
                    Hover a region, click to reveal deeper structures. Move away to return to the crowd.
                  </p>
                </div>
              </motion.div>
            ) : null}

            {state.mode === "selecting" ? (
              <div className="anatomy-scene__loading anatomy-scene__loading--overlay">
                <div className="anatomy-scene__loading-orbit" />
                <p className="text-sm text-muted">Preparing anatomy model…</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </GlassCard>
  );
}
