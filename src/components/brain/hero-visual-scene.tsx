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
  const id = useId().replace(/:/g, "");
  const gradientId = `${id}-gradient`;
  const patternId = `${id}-particles`;
  const glowId = `${id}-glow`;
  const heartPath =
    "M80 132C69 114 20 90 20 49C20 24 39 13 58 16C70 18 77 27 80 38C84 27 91 18 103 16C124 12 141 27 140 50C139 90 91 115 80 132Z";

  return (
    <div className="heart-visual-fallback" aria-hidden="true">
      <svg viewBox="0 0 160 145" role="presentation">
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="18"
            y1="70"
            x2="142"
            y2="70"
          >
            <stop offset="0" stopColor="#08c8ff" />
            <stop offset="0.38" stopColor="#4f46ff" />
            <stop offset="0.58" stopColor="#a329ff" />
            <stop offset="1" stopColor="#ff2fa8" />
          </linearGradient>
          <pattern
            id={patternId}
            width="3.2"
            height="3.2"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="0.9"
              cy="0.9"
              r="0.58"
              fill={`url(#${gradientId})`}
            />
            <circle
              cx="2.5"
              cy="2.2"
              r="0.34"
              fill={`url(#${gradientId})`}
            />
          </pattern>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="heart-fallback__orbits" fill="none">
          <ellipse
            cx="80"
            cy="73"
            rx="72"
            ry="48"
            transform="rotate(-16 80 73)"
            stroke={`url(#${gradientId})`}
            strokeDasharray="2 5 10 4"
            strokeWidth="0.65"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-84"
              dur="6s"
              repeatCount="indefinite"
            />
          </ellipse>
          <ellipse
            cx="80"
            cy="73"
            rx="68"
            ry="57"
            transform="rotate(19 80 73)"
            stroke={`url(#${gradientId})`}
            strokeDasharray="1 7 5 3"
            strokeWidth="0.55"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="74"
              dur="8s"
              repeatCount="indefinite"
            />
          </ellipse>
        </g>

        <g transform="translate(80 74)">
          <g>
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1;1.055;1;1.03;1;1"
              keyTimes="0;0.09;0.2;0.3;0.41;1"
              dur="1.18s"
              repeatCount="indefinite"
            />
            <g transform="translate(-80 -74)">
              <path
                d={heartPath}
                fill={`url(#${gradientId})`}
                opacity="0.16"
                filter={`url(#${glowId})`}
              >
                <animate
                  attributeName="opacity"
                  values="0.12;0.28;0.14;0.22;0.12"
                  keyTimes="0;0.1;0.24;0.34;1"
                  dur="1.18s"
                  repeatCount="indefinite"
                />
              </path>
              <path d={heartPath} fill={`url(#${patternId})`} opacity="0.88" />
              <path
                d={heartPath}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="2.2"
                strokeLinecap="round"
                filter={`url(#${glowId})`}
              >
                <animate
                  attributeName="stroke-width"
                  values="2.1;3.2;2.1;2.7;2.1"
                  keyTimes="0;0.1;0.22;0.33;1"
                  dur="1.18s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          </g>
        </g>

        <g fill={`url(#${gradientId})`} filter={`url(#${glowId})`}>
          <circle cx="12" cy="42" r="1.1">
            <animate attributeName="opacity" values="0.1;1;0.1" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="149" cy="58" r="1.3">
            <animate attributeName="opacity" values="1;0.15;1" dur="3.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="35" cy="122" r="0.9">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.9s" repeatCount="indefinite" />
          </circle>
          <circle cx="132" cy="119" r="0.8">
            <animate attributeName="opacity" values="1;0.2;1" dur="2.7s" repeatCount="indefinite" />
          </circle>
        </g>
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
      aria-label="Interactive neon particle heart"
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
