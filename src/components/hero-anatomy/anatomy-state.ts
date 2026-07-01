import { DEFAULT_CAMERA, REGION_BY_ID, type AnatomyRegionId } from "./anatomy-regions";

export type SceneMode =
  | "idle"
  | "selecting"
  | "anatomy_default"
  | "anatomy_hover"
  | "anatomy_zoomed"
  | "reverting";

export type AnatomySceneState = {
  mode: SceneMode;
  selectedFigureId: string | null;
  hoveredRegion: AnatomyRegionId | null;
  zoomedRegion: AnatomyRegionId | null;
  cameraTarget: [number, number, number];
  cameraDistance: number;
};

export const initialAnatomyState: AnatomySceneState = {
  mode: "idle",
  selectedFigureId: null,
  hoveredRegion: null,
  zoomedRegion: null,
  cameraTarget: DEFAULT_CAMERA.target,
  cameraDistance: DEFAULT_CAMERA.distance,
};

export type AnatomyAction =
  | { type: "SELECT"; id: string }
  | { type: "SELECT_COMPLETE" }
  | { type: "HOVER_REGION"; id: AnatomyRegionId }
  | { type: "UNHOVER_REGION" }
  | { type: "CLICK_REGION"; id: AnatomyRegionId }
  | { type: "CLICK_MODEL_BG" }
  | { type: "REVERT" }
  | { type: "REVERT_COMPLETE" };

function withDefaultCamera(state: AnatomySceneState): AnatomySceneState {
  return {
    ...state,
    cameraTarget: DEFAULT_CAMERA.target,
    cameraDistance: DEFAULT_CAMERA.distance,
    hoveredRegion: null,
    zoomedRegion: null,
  };
}

export function anatomyReducer(state: AnatomySceneState, action: AnatomyAction): AnatomySceneState {
  switch (action.type) {
    case "SELECT":
      if (state.mode !== "idle") return state;
      return {
        ...state,
        mode: "selecting",
        selectedFigureId: action.id,
      };

    case "SELECT_COMPLETE":
      if (state.mode !== "selecting") return state;
      return {
        ...withDefaultCamera(state),
        mode: "anatomy_default",
      };

    case "HOVER_REGION":
      if (state.mode !== "anatomy_default" && state.mode !== "anatomy_hover") return state;
      if (state.zoomedRegion) return state;
      return {
        ...state,
        mode: "anatomy_hover",
        hoveredRegion: action.id,
      };

    case "UNHOVER_REGION":
      if (state.mode !== "anatomy_hover") return state;
      return {
        ...state,
        mode: "anatomy_default",
        hoveredRegion: null,
      };

    case "CLICK_REGION": {
      if (state.mode !== "anatomy_default" && state.mode !== "anatomy_hover") return state;
      const region = REGION_BY_ID[action.id];
      return {
        ...state,
        mode: "anatomy_zoomed",
        hoveredRegion: action.id,
        zoomedRegion: action.id,
        cameraTarget: region.cameraTarget,
        cameraDistance: region.cameraDistance,
      };
    }

    case "CLICK_MODEL_BG":
      if (state.mode !== "anatomy_zoomed") return state;
      return {
        ...withDefaultCamera(state),
        mode: "anatomy_default",
      };

    case "REVERT":
      if (state.mode === "idle" || state.mode === "reverting" || state.mode === "selecting") return state;
      return {
        ...state,
        mode: "reverting",
      };

    case "REVERT_COMPLETE":
      return initialAnatomyState;

    default:
      return state;
  }
}
