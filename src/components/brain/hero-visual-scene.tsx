"use client";

import dynamic from "next/dynamic";
import { useId, useRef, type PointerEvent } from "react";
import { useReducedMotion } from "framer-motion";
import type { HeartCanvasController } from "@/components/brain/particle-heart-canvas";

const ParticleHeartCanvas = dynamic(
  () =>
    import("@/components/brain/particle-heart-canvas").then(
      (module) => module.ParticleHeartCanvas,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

function HeartFallbackGraphic() {
  const patternId = useId().replace(/:/g, "");

  return (
    <div className="heart-visual-fallback" aria-hidden="true">
      <svg viewBox="0 0 120 108" role="presentation">
        <defs>
          <pattern
            id={patternId}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="1.15" fill="#ef233c" />
            <circle cx="4" cy="4" r="0.7" fill="#ff5964" />
          </pattern>
        </defs>
        <path
          d="M60 101C52 87 12 67 12 35C12 15 27 6 43 7C52 8 58 14 60 22C63 14 69 8 78 7C95 5 108 17 108 35C108 67 68 87 60 101Z"
          fill={`url(#${patternId})`}
        />
      </svg>
    </div>
  );
}

export function HeroVisualScene() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const controllerRef = useRef<HeartCanvasController | null>(null);

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    controllerRef.current?.rippleAt(event.clientX, event.clientY);
  };

  return (
    <div
      className="hero-visual-scene"
      role="img"
      aria-label="Interactive red particle heart"
      onPointerMove={(event) =>
        controllerRef.current?.pointerMove(event.clientX, event.clientY)
      }
      onPointerLeave={() => controllerRef.current?.pointerLeave()}
      onPointerCancel={() => controllerRef.current?.pointerLeave()}
      onPointerUp={handlePointerUp}
    >
      <HeartFallbackGraphic />
      <ParticleHeartCanvas
        controllerRef={controllerRef}
        fallback={null}
        reducedMotion={prefersReducedMotion}
      />
    </div>
  );
}
