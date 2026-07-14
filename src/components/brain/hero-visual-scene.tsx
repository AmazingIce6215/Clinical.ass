"use client";

import { gsap } from "gsap";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useReducedMotion } from "framer-motion";
import type { HeartCanvasController } from "@/components/brain/particle-heart-canvas";

const GESTURE_DELAY_MS = 290;
const DOUBLE_TAP_DISTANCE_PX = 28;

const ParticleHeartCanvas = dynamic(
  () =>
    import("@/components/brain/particle-heart-canvas").then(
      (module) => module.ParticleHeartCanvas,
    ),
  {
    ssr: false,
    loading: () => <HeartFallbackGraphic loading />,
  },
);

type PendingTap = {
  clientX: number;
  clientY: number;
  startedAt: number;
  timer: number;
};

function HeartFallbackGraphic({
  faded = false,
  loading = false,
}: {
  faded?: boolean;
  loading?: boolean;
}) {
  const patternId = useId().replace(/:/g, "");

  return (
    <div
      className={`heart-visual-fallback${faded ? " heart-visual-fallback--faded" : ""}`}
      data-testid={loading ? "heart-loading-fallback" : "heart-webgl-fallback"}
      aria-hidden="true"
    >
      <span className="heart-visual-fallback__halo" />
      <svg viewBox="0 0 120 108" role="presentation">
        <defs>
          <pattern
            id={patternId}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.25" fill="#58d5ff" />
            <circle cx="5" cy="5" r="0.8" fill="#4f6fff" opacity="0.72" />
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

function CaseOfTheDayCard({
  cardRef,
  onBack,
  revealed,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  revealed: boolean;
}) {
  return (
    <div
      ref={cardRef}
      className="heart-case-card"
      aria-hidden={!revealed}
      aria-live="polite"
    >
      <button
        type="button"
        className="heart-case-card__back"
        onClick={onBack}
        tabIndex={revealed ? 0 : -1}
      >
        <span aria-hidden="true">←</span>
        Reform heart
      </button>

      <div className="heart-case-card__content">
        <div className="heart-case-card__eyebrow">
          <span className="heart-case-card__signal" aria-hidden="true" />
          Case of the day · Cardiology
        </div>
        <h2>The rhythm changed before the room did.</h2>
        <p>
          A 67-year-old develops sudden palpitations, light-headedness, and
          shortness of breath. The pulse is fast and irregular, but blood
          pressure remains stable. What should you assess first?
        </p>

        <div className="heart-case-card__vitals" aria-label="Patient vital signs">
          <span><small>HR</small> 148</span>
          <span><small>BP</small> 112/70</span>
          <span><small>SpO₂</small> 95%</span>
        </div>

        <Link
          href="/teaching/cardiology"
          className="heart-case-card__cta"
          tabIndex={revealed ? 0 : -1}
        >
          Practice cardiology
          <span aria-hidden="true">↗</span>
        </Link>
        <p className="heart-case-card__footnote">
          Educational scenario · approximately 3 minutes
        </p>
      </div>
    </div>
  );
}

export function HeroVisualScene() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [revealed, setRevealed] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const backButtonFocusTimerRef = useRef<number | null>(null);
  const sceneFocusTimerRef = useRef<number | null>(null);
  const pendingTapRef = useRef<PendingTap | null>(null);
  const controllerRef = useRef<HeartCanvasController | null>(null);
  const cardTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const clearPendingTap = useCallback(() => {
    if (!pendingTapRef.current) return;
    window.clearTimeout(pendingTapRef.current.timer);
    pendingTapRef.current = null;
  }, []);

  const revealCase = useCallback(
    (clientX?: number, clientY?: number, fromKeyboard = false) => {
      clearPendingTap();
      controllerRef.current?.pointerLeave();
      controllerRef.current?.setDissolveOrigin(clientX, clientY);
      setRevealed(true);

      if (fromKeyboard) {
        if (backButtonFocusTimerRef.current != null) {
          window.clearTimeout(backButtonFocusTimerRef.current);
        }
        backButtonFocusTimerRef.current = window.setTimeout(() => {
          cardRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }, prefersReducedMotion ? 220 : 920);
      }
    },
    [clearPendingTap, prefersReducedMotion],
  );

  const reformHeart = useCallback(() => {
    clearPendingTap();
    setRevealed(false);
    if (sceneFocusTimerRef.current != null) {
      window.clearTimeout(sceneFocusTimerRef.current);
    }
    sceneFocusTimerRef.current = window.setTimeout(() => {
      sceneRef.current?.focus();
    }, prefersReducedMotion ? 220 : 920);
  }, [clearPendingTap, prefersReducedMotion]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    const context = gsap.context(() => {
      gsap.set(card, { opacity: 0, filter: "blur(12px)", y: 10 });
      cardTimelineRef.current = gsap
        .timeline({ paused: true })
        .to(
          card,
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: prefersReducedMotion ? 0.2 : 0.36,
            ease: "power2.out",
          },
          prefersReducedMotion ? 0 : 0.54,
        );
    }, sceneRef);

    return () => {
      cardTimelineRef.current?.kill();
      cardTimelineRef.current = null;
      context.revert();
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (revealed) cardTimelineRef.current?.play();
    else cardTimelineRef.current?.reverse();
  }, [revealed]);

  useEffect(() => {
    return () => {
      clearPendingTap();
      if (backButtonFocusTimerRef.current != null) {
        window.clearTimeout(backButtonFocusTimerRef.current);
      }
      if (sceneFocusTimerRef.current != null) {
        window.clearTimeout(sceneFocusTimerRef.current);
      }
    };
  }, [clearPendingTap]);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (revealed) return;
      controllerRef.current?.pointerMove(event.clientX, event.clientY);
    },
    [revealed],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (revealed || (event.pointerType === "mouse" && event.button !== 0)) {
        return;
      }

      const currentTap = {
        clientX: event.clientX,
        clientY: event.clientY,
        startedAt: performance.now(),
      };
      const pendingTap = pendingTapRef.current;

      if (pendingTap) {
        const distance = Math.hypot(
          currentTap.clientX - pendingTap.clientX,
          currentTap.clientY - pendingTap.clientY,
        );
        const elapsed = currentTap.startedAt - pendingTap.startedAt;

        if (elapsed <= GESTURE_DELAY_MS && distance <= DOUBLE_TAP_DISTANCE_PX) {
          clearPendingTap();
          revealCase(currentTap.clientX, currentTap.clientY);
          return;
        }

        window.clearTimeout(pendingTap.timer);
        controllerRef.current?.rippleAt(pendingTap.clientX, pendingTap.clientY);
      }

      const timer = window.setTimeout(() => {
        controllerRef.current?.rippleAt(currentTap.clientX, currentTap.clientY);
        pendingTapRef.current = null;
      }, GESTURE_DELAY_MS);

      pendingTapRef.current = { ...currentTap, timer };
    },
    [clearPendingTap, revealCase, revealed],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (revealed || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      const rect = sceneRef.current?.getBoundingClientRect();
      revealCase(
        rect ? rect.left + rect.width / 2 : undefined,
        rect ? rect.top + rect.height / 2 : undefined,
        true,
      );
    },
    [revealCase, revealed],
  );

  return (
    <div
      ref={sceneRef}
      className="hero-visual-scene"
      data-state={revealed ? "case" : "heart"}
      role={revealed ? "group" : "button"}
      tabIndex={revealed ? -1 : 0}
      aria-label={
        revealed
          ? "Case of the day"
          : "Interactive particle heart. Click for a pulse, double-click to reveal the case of the day, or press Enter."
      }
      aria-pressed={revealed ? undefined : false}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => controllerRef.current?.pointerLeave()}
      onPointerCancel={() => controllerRef.current?.pointerLeave()}
      onPointerUp={handlePointerUp}
    >
      <div className="hero-visual-scene__backdrop" aria-hidden="true" />
      <div className="hero-visual-scene__grid" aria-hidden="true" />
      <div className="hero-visual-scene__aurora" aria-hidden="true" />

      <CaseOfTheDayCard
        cardRef={cardRef}
        onBack={reformHeart}
        revealed={revealed}
      />

      <div className="heart-canvas-layer" aria-hidden="true">
        <ParticleHeartCanvas
          controllerRef={controllerRef}
          fallback={<HeartFallbackGraphic faded={revealed} />}
          mode={revealed ? "case" : "heart"}
          reducedMotion={prefersReducedMotion}
        />
      </div>

      <div className="heart-visual-status" aria-hidden="true">
        <span />
        Living field
      </div>

      <div className="heart-visual-caption" aria-hidden="true">
        <p className="heart-visual-caption__mouse">
          Move to attract · click to pulse · double-click to reveal
        </p>
        <p className="heart-visual-caption__touch">
          Tap to pulse · double-tap to reveal
        </p>
      </div>
    </div>
  );
}
