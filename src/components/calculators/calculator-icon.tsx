import {
  Activity,
  AirVent,
  Baby,
  Brain,
  Droplets,
  ShieldAlert,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type { CalculatorIconKey } from "@/lib/calculators/types";
import { cn } from "@/lib/utils";

const icons: Record<CalculatorIconKey, LucideIcon> = {
  activity: Activity,
  "air-vent": AirVent,
  baby: Baby,
  brain: Brain,
  droplets: Droplets,
  "shield-alert": ShieldAlert,
  stethoscope: Stethoscope,
};

export function CalculatorIcon({
  name,
  className,
  decorative = true,
}: {
  name: CalculatorIconKey;
  className?: string;
  decorative?: boolean;
}) {
  const Icon = icons[name];

  return (
    <Icon
      aria-hidden={decorative ? "true" : undefined}
      className={cn("size-5", className)}
      focusable="false"
    />
  );
}
