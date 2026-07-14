import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { HeroVisualScene } from "@/components/brain/hero-visual-scene";

const mockController = {
  pointerMove: jest.fn(),
  pointerLeave: jest.fn(),
  rippleAt: jest.fn(),
};

jest.mock("framer-motion", () => ({
  useReducedMotion: () => false,
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const React = jest.requireActual<typeof import("react")>("react");

    return function MockParticleHeartCanvas({
      controllerRef,
    }: {
      controllerRef: React.Ref<unknown>;
    }) {
      React.useImperativeHandle(controllerRef, () => mockController);
      return <div data-testid="particle-heart-canvas" />;
    };
  },
}));

function pointerEvent(
  type: "pointerMove" | "pointerUp",
  element: Element,
  clientX: number,
  clientY: number,
) {
  const event = createEvent[type](element);
  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
    pointerType: { value: "mouse" },
    button: { value: 0 },
  });
  fireEvent(element, event);
}

describe("HeroVisualScene", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders only the interactive heart surface", () => {
    render(<HeroVisualScene />);

    expect(
      screen.getByRole("img", { name: /interactive neon particle heart/i }),
    ).toBeVisible();
    expect(screen.getByTestId("particle-heart-canvas")).toBeVisible();
    expect(screen.queryByText(/living field/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/case of the day/i)).not.toBeInTheDocument();
  });

  it("forwards pointer attraction and click ripples immediately", () => {
    render(<HeroVisualScene />);
    const scene = screen.getByRole("img", {
      name: /interactive neon particle heart/i,
    });

    pointerEvent("pointerMove", scene, 120, 160);
    pointerEvent("pointerUp", scene, 120, 160);
    fireEvent.pointerLeave(scene);

    expect(mockController.pointerMove).toHaveBeenCalledWith(120, 160);
    expect(mockController.rippleAt).toHaveBeenCalledWith(120, 160);
    expect(mockController.pointerLeave).toHaveBeenCalledTimes(1);
  });
});
