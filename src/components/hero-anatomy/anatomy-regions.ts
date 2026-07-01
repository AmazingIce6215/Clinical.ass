export type AnatomyRegionId =
  | "head"
  | "thorax"
  | "abdomen"
  | "pelvis"
  | "left_arm"
  | "right_arm"
  | "left_leg"
  | "right_leg";

export type AnatomyRegion = {
  id: AnatomyRegionId;
  meshNames: string[];
  cameraTarget: [number, number, number];
  cameraDistance: number;
  deeperLayerMeshNames?: string[];
};

export const DEFAULT_CAMERA = {
  target: [0, 1.05, 0] as [number, number, number],
  distance: 3.2,
};

export const REGIONS: AnatomyRegion[] = [
  {
    id: "head",
    meshNames: ["Head_Skin"],
    cameraTarget: [0, 1.62, 0],
    cameraDistance: 1.05,
    deeperLayerMeshNames: ["Head_Muscle", "Brain"],
  },
  {
    id: "thorax",
    meshNames: ["Thorax_Skin"],
    cameraTarget: [0, 1.35, 0],
    cameraDistance: 1.35,
    deeperLayerMeshNames: ["Thorax_Muscle", "Ribcage", "Heart", "Lungs"],
  },
  {
    id: "abdomen",
    meshNames: ["Abdomen_Skin"],
    cameraTarget: [0, 0.95, 0],
    cameraDistance: 1.35,
    deeperLayerMeshNames: ["Abdomen_Muscle", "Stomach", "Intestines"],
  },
  {
    id: "pelvis",
    meshNames: ["Pelvis_Skin"],
    cameraTarget: [0, 0.62, 0],
    cameraDistance: 1.25,
    deeperLayerMeshNames: ["Pelvis_Muscle", "Pelvis_Bone"],
  },
  {
    id: "left_arm",
    meshNames: ["LeftArm_Skin"],
    cameraTarget: [-0.55, 1.2, 0],
    cameraDistance: 1.15,
    deeperLayerMeshNames: ["LeftArm_Muscle", "LeftArm_Bone"],
  },
  {
    id: "right_arm",
    meshNames: ["RightArm_Skin"],
    cameraTarget: [0.55, 1.2, 0],
    cameraDistance: 1.15,
    deeperLayerMeshNames: ["RightArm_Muscle", "RightArm_Bone"],
  },
  {
    id: "left_leg",
    meshNames: ["LeftLeg_Skin"],
    cameraTarget: [-0.22, 0.35, 0],
    cameraDistance: 1.35,
    deeperLayerMeshNames: ["LeftLeg_Muscle", "LeftLeg_Bone"],
  },
  {
    id: "right_leg",
    meshNames: ["RightLeg_Skin"],
    cameraTarget: [0.22, 0.35, 0],
    cameraDistance: 1.35,
    deeperLayerMeshNames: ["RightLeg_Muscle", "RightLeg_Bone"],
  },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((region) => [region.id, region])) as Record<
  AnatomyRegionId,
  AnatomyRegion
>;

export function regionForMeshName(meshName: string): AnatomyRegion | undefined {
  return REGIONS.find(
    (region) =>
      region.meshNames.includes(meshName) ||
      region.deeperLayerMeshNames?.includes(meshName),
  );
}
