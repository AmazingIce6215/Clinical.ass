"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        selected
          ? "border-accent bg-accent/15 text-accent shadow-glow-sm"
          : "border-border/80 bg-surface/50 text-foreground hover:border-accent/40 hover:bg-surface",
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {label}
    </motion.button>
  );
}

export function ChipGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <motion.div layout className="flex flex-wrap gap-2.5">
      {options.map((option) => (
        <Chip
          key={option}
          label={option}
          selected={selected.includes(option)}
          onClick={() => onToggle(option)}
        />
      ))}
    </motion.div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-base outline-none transition placeholder:text-muted/60 focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border/70 bg-surface/50 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "relative rounded-lg px-4 py-2 text-sm font-medium transition",
            value === opt.value ? "text-accent-foreground" : "text-muted hover:text-foreground",
          )}
        >
          {value === opt.value && (
            <motion.div
              layoutId="segment-bg"
              className="absolute inset-0 rounded-lg bg-accent shadow-glow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
