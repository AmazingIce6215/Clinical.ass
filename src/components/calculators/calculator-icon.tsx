import {
  Activity,
  AirVent,
  Baby,
  Bone,
  Brain,
  Droplets,
  FlaskConical,
  HeartPulse,
  Hospital,
  Pill,
  Scale,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import type { CalculatorIconKey } from "@/lib/calculators/types";
import { cn } from "@/lib/utils";

/** Lucide does not ship a kidney icon; Droplets stands in for renal tools. */
const icons: Record<CalculatorIconKey, LucideIcon> = {
  activity: Activity,
  "air-vent": AirVent,
  baby: Baby,
  bone: Bone,
  brain: Brain,
  droplets: Droplets,
  "flask-conical": FlaskConical,
  "heart-pulse": HeartPulse,
  hospital: Hospital,
  kidney: Droplets,
  pill: Pill,
  scale: Scale,
  "shield-alert": ShieldAlert,
  stethoscope: Stethoscope,
  syringe: Syringe,
  thermometer: Thermometer,
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
