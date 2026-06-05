import type { ClinicalStepResponse } from "./types";

const SKIPPED = "Not assessed";

export function buildStepValue(
  step: ClinicalStepResponse,
  stepAnswer: string[],
  textAnswer: string,
  customDetail: string,
): string | string[] | boolean {
  if (step.inputType === "text") {
    const lines = textAnswer
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 1) return lines;
    return textAnswer.trim();
  }

  const parts = [...stepAnswer];
  if (customDetail.trim() && !parts.includes(customDetail.trim())) {
    parts.push(customDetail.trim());
  }

  if (step.inputType === "multiselect" || step.inputType === "chips") {
    return parts.length > 0 ? parts : textAnswer.trim() ? [textAnswer.trim()] : [];
  }

  if (step.inputType === "yesno") {
    return parts[0] === "Yes";
  }

  return parts.join("; ") || textAnswer.trim();
}

export function buildSkippedValue(step: ClinicalStepResponse): string | string[] | boolean {
  if (step.inputType === "multiselect" || step.inputType === "chips") return [SKIPPED];
  if (step.inputType === "yesno") return false;
  return SKIPPED;
}

export function isMultiSelectStep(step: ClinicalStepResponse): boolean {
  return step.inputType === "multiselect" || step.inputType === "chips";
}

export function isStepValid(
  step: ClinicalStepResponse,
  stepAnswer: string[],
  textAnswer: string,
  customDetail: string,
): boolean {
  if (step.category === "complete" || step.fieldKey === "complete") return true;
  if (step.inputType === "text") return !!textAnswer.trim();
  return stepAnswer.length > 0 || !!customDetail.trim() || !!textAnswer.trim();
}
