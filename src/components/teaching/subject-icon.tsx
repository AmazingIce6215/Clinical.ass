import {
  Activity,
  Baby,
  Brain,
  MessageCircle,
  Microscope,
  PersonStanding,
  ScanLine,
  Scissors,
  Siren,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type { TeachingSubjectIconName } from "@/lib/teaching-subjects";

const subjectIcons: Record<TeachingSubjectIconName, LucideIcon> = {
  activity: Activity,
  baby: Baby,
  brain: Brain,
  "message-circle": MessageCircle,
  microscope: Microscope,
  "person-standing": PersonStanding,
  "scan-line": ScanLine,
  scissors: Scissors,
  siren: Siren,
  stethoscope: Stethoscope,
};

export function TeachingSubjectIcon({
  name,
  className,
}: {
  name: TeachingSubjectIconName;
  className?: string;
}) {
  const Icon = subjectIcons[name];

  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />;
}
