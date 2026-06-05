"use client";

import { motion } from "framer-motion";
import { ChipGrid } from "@/components/ui/inputs";
import type { ClinicalStepResponse } from "@/lib/types";
import { isMultiSelectStep } from "@/lib/step-utils";
import { cn } from "@/lib/utils";

export function ReasonBanner({ reason }: { reason: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mb-5 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-muted"
    >
      <span className="font-medium text-sky-600 dark:text-sky-400">Why we ask: </span>
      {reason}
    </motion.div>
  );
}

export function StepInput({
  step,
  stepAnswer,
  setStepAnswer,
  textAnswer,
  setTextAnswer,
  customDetail,
  setCustomDetail,
}: {
  step: ClinicalStepResponse;
  stepAnswer: string[];
  setStepAnswer: (v: string[]) => void;
  textAnswer: string;
  setTextAnswer: (v: string) => void;
  customDetail: string;
  setCustomDetail: (v: string) => void;
}) {
  const multi = isMultiSelectStep(step);

  const toggle = (value: string) => {
    if (multi) {
      setStepAnswer(
        stepAnswer.includes(value)
          ? stepAnswer.filter((x) => x !== value)
          : [...stepAnswer, value],
      );
    } else {
      setStepAnswer([value]);
    }
  };

  if (step.inputType === "text") {
    return (
      <textarea
        value={textAnswer}
        onChange={(e) => setTextAnswer(e.target.value)}
        rows={4}
        placeholder="Enter findings..."
        className="w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
      />
    );
  }

  if (step.inputType === "yesno") {
    return (
      <ChipGrid
        options={["Yes", "No"]}
        selected={stepAnswer}
        onToggle={toggle}
      />
    );
  }

  return (
    <div className="space-y-4">
      {multi && (
        <p className="text-xs text-muted">Select all that apply</p>
      )}
      <ChipGrid
        options={step.options ?? []}
        selected={stepAnswer}
        onToggle={toggle}
      />
      {step.allowCustom && (
        <input
          value={customDetail}
          onChange={(e) => setCustomDetail(e.target.value)}
          placeholder="Add custom detail..."
          className={cn(
            "w-full rounded-xl border border-border/80 bg-surface/60 px-4 py-3 text-sm outline-none focus:border-accent/50",
          )}
        />
      )}
    </div>
  );
}
