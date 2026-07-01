export type BrainRegionId = "frontal" | "temporal" | "parietal" | "occipital" | "cerebellum";

export type BrainRegion = {
  id: BrainRegionId;
  label: string;
  description: string;
  color: string;
  position: [number, number, number];
};

export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: "frontal",
    label: "Frontal",
    description: "Executive function / reasoning",
    color: "#43f3ff",
    position: [0, 0.6, 1.1],
  },
  {
    id: "temporal",
    label: "Temporal",
    description: "Memory / case recall",
    color: "#7c5cff",
    position: [-1.1, -0.2, 0.4],
  },
  {
    id: "parietal",
    label: "Parietal",
    description: "Spatial / anatomy",
    color: "#56ffd2",
    position: [0.25, 1.0, 0.15],
  },
  {
    id: "occipital",
    label: "Occipital",
    description: "Imaging / radiology",
    color: "#2dd4ff",
    position: [0.95, 0.1, -1.1],
  },
  {
    id: "cerebellum",
    label: "Cerebellum",
    description: "Motor / coordination logic",
    color: "#b46cff",
    position: [0, -1.3, -0.55],
  },
];

