import {
  Activity,
  Calculator,
  ChartNoAxesCombined,
  ClipboardCheck,
  GraduationCap,
  Images,
  Library,
  Presentation,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type { ModuleIconName } from "@/lib/modules";

const icons: Record<ModuleIconName, LucideIcon> = {
  activity: Activity,
  calculator: Calculator,
  chart: ChartNoAxesCombined,
  clipboard: ClipboardCheck,
  graduation: GraduationCap,
  image: Images,
  library: Library,
  presentation: Presentation,
  stethoscope: Stethoscope,
};

export function ModuleIcon({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: ModuleIconName;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}
