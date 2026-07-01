"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Direction = "left" | "right";

type WalkingFigure = {
  id: string;
  direction: Direction;
  duration: number;
  delay: number;
  depth: number;
  lane: number;
  scale: number;
};

const MAX_FIGURES = 7;
const SPAWN_INTERVAL_MS = 1400;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createFigure(): WalkingFigure {
  return {
    id: crypto.randomUUID(),
    direction: Math.random() > 0.5 ? "left" : "right",
    duration: randomBetween(8, 14),
    delay: randomBetween(0, 2),
    depth: randomBetween(0.35, 0.95),
    lane: Math.floor(randomBetween(0, 4)),
    scale: randomBetween(0.82, 1.08),
  };
}

function PersonSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 64"
      aria-hidden="true"
      className={cn("walking-figure__svg", className)}
    >
      <path
        d="M16 4c3.2 0 5.5 2.4 5.5 5.4 0 2.8-1.8 4.8-3.8 6.1 4.2 1.4 7.3 5.2 7.3 9.7v2.1c0 .8-.6 1.4-1.4 1.4h-1.2v18.4c0 2.2-1.8 4-4 4s-4-1.8-4-4V27.7h-1.2c-.8 0-1.4-.6-1.4-1.4v-2.1c0-4.5 3.1-8.3 7.3-9.7C10.3 14.2 8.5 12.2 8.5 9.4 8.5 6.4 10.8 4 16 4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WalkingFigureView({
  figure,
  onSelect,
}: {
  figure: WalkingFigure;
  onSelect: (id: string) => void;
}) {
  const style = {
    ["--walk-duration" as string]: `${figure.duration}s`,
    ["--walk-delay" as string]: `${figure.delay}s`,
    ["--walk-depth" as string]: figure.depth,
    ["--walk-scale" as string]: figure.scale,
    ["--walk-lane" as string]: figure.lane,
  };

  return (
    <button
      type="button"
      aria-label="Explore human anatomy"
      className={cn(
        "walking-figure",
        figure.direction === "left" ? "walking-figure--left" : "walking-figure--right",
      )}
      style={style}
      onClick={() => onSelect(figure.id)}
    >
      {[0, 1, 2].map((ghostIndex) => (
        <span
          key={ghostIndex}
          className="walking-figure__ghost"
          style={{ ["--ghost-index" as string]: ghostIndex }}
          aria-hidden="true"
        >
          <PersonSilhouette />
        </span>
      ))}
      <span className="walking-figure__body">
        <PersonSilhouette />
      </span>
    </button>
  );
}

export function WalkingCrowd({ onSelectFigure }: { onSelectFigure: (id: string) => void }) {
  const [figures, setFigures] = useState<WalkingFigure[]>(() =>
    Array.from({ length: 4 }, () => createFigure()),
  );

  const spawnFigure = useCallback(() => {
    setFigures((current) => {
      const next = [...current, createFigure()];
      return next.slice(-MAX_FIGURES);
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(spawnFigure, SPAWN_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [spawnFigure]);

  const laneHint = useMemo(
    () => (
      <div className="walking-crowd__hint">
        <p className="shell-kicker mb-1">Interactive anatomy</p>
        <p className="text-sm text-muted">Tap a figure to explore</p>
      </div>
    ),
    [],
  );

  return (
    <div className="walking-crowd">
      <div className="walking-crowd__road" aria-hidden="true" />
      {laneHint}
      {figures.map((figure) => (
        <WalkingFigureView key={figure.id} figure={figure} onSelect={onSelectFigure} />
      ))}
    </div>
  );
}
