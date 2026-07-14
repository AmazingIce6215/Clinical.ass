export type ModuleGroup = "encounter" | "practice" | "tools" | "workspace" | "progress";

export type ModuleIconName =
  | "activity"
  | "calculator"
  | "chart"
  | "clipboard"
  | "graduation"
  | "image"
  | "library"
  | "presentation"
  | "stethoscope";

export interface ModuleDefinition {
  id: string;
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  group: ModuleGroup;
  icon: ModuleIconName;
}

export const moduleGroups: Array<{ id: ModuleGroup; label: string }> = [
  { id: "encounter", label: "Patient encounter" },
  { id: "practice", label: "Practice" },
  { id: "tools", label: "Clinical tools" },
  { id: "workspace", label: "Workspace" },
  { id: "progress", label: "Progress" },
];

export const modules: ModuleDefinition[] = [
  {
    id: "clinical",
    href: "/clinical",
    label: "Clinical reasoning",
    shortLabel: "Clinical",
    description: "Organize de-identified findings from a supervised patient encounter and review an AI-assisted differential.",
    group: "encounter",
    icon: "stethoscope",
  },
  {
    id: "classic",
    href: "/classic",
    label: "Case presentation",
    shortLabel: "Classic",
    description: "Turn a de-identified history and examination into a structured case presentation.",
    group: "encounter",
    icon: "presentation",
  },
  {
    id: "teaching",
    href: "/teaching",
    label: "Teaching bank",
    shortLabel: "Teaching",
    description: "Practice generated case questions with explanations and saved progress.",
    group: "practice",
    icon: "graduation",
  },
  {
    id: "osce",
    href: "/osce",
    label: "OSCE practice",
    shortLabel: "OSCE",
    description: "Run a timed patient interview and receive formative feedback.",
    group: "practice",
    icon: "clipboard",
  },
  {
    id: "image-diagnosis",
    href: "/image-diagnosis",
    label: "Image analysis",
    shortLabel: "Images",
    description: "Upload a de-identified clinical image for a structured AI-assisted interpretation.",
    group: "tools",
    icon: "image",
  },
  {
    id: "calculators",
    href: "/calculators",
    label: "Clinical calculators",
    shortLabel: "Calculators",
    description: "Use common scoring tools with limitations and source information in view.",
    group: "tools",
    icon: "calculator",
  },
  {
    id: "library",
    href: "/library",
    label: "Case library",
    shortLabel: "Library",
    description: "Return to cases and teaching sessions saved on this device.",
    group: "workspace",
    icon: "library",
  },
  {
    id: "stats",
    href: "/stats",
    label: "Learning progress",
    shortLabel: "Progress",
    description: "Review practice history, strengths, and areas to revisit.",
    group: "progress",
    icon: "chart",
  },
];

export function getModuleByPath(pathname: string) {
  return modules
    .filter((module) => pathname === module.href || pathname.startsWith(`${module.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
