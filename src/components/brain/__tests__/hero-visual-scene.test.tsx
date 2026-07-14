import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { HeroVisualScene } from "@/components/brain/hero-visual-scene";

const mockController = {
  pointerMove: jest.fn(),
  pointerLeave: jest.fn(),
  rippleAt: jest.fn(),
  dissolveAt: jest.fn(),
  reform: jest.fn(),
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
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders only the interactive heart surface", () => {
    render(<HeroVisualScene />);

    expect(
      screen.getByRole("group", { name: /interactive red particle heart/i }),
    ).toBeVisible();
    expect(screen.getByTestId("particle-heart-canvas")).toBeVisible();
    expect(screen.queryByText(/living field/i)).not.toBeInTheDocument();
    expect(document.querySelector(".heart-case-card")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("forwards pointer attraction and defers a single-click ripple", () => {
    render(<HeroVisualScene />);
    const scene = screen.getByRole("group", {
      name: /interactive red particle heart/i,
    });

    pointerEvent("pointerMove", scene, 120, 160);
    pointerEvent("pointerUp", scene, 120, 160);
    fireEvent.pointerLeave(scene);

    expect(mockController.pointerMove).toHaveBeenCalledWith(120, 160);
    expect(mockController.rippleAt).not.toHaveBeenCalled();
    jest.advanceTimersByTime(260);
    expect(mockController.rippleAt).toHaveBeenCalledWith(120, 160);
    expect(mockController.pointerLeave).toHaveBeenCalledTimes(1);
  });

  it("cancels the click ripple and reveals the case on double-click", () => {
    render(<HeroVisualScene />);
    const scene = screen.getByRole("group", {
      name: /interactive red particle heart/i,
    });

    pointerEvent("pointerUp", scene, 150, 170);
    fireEvent.doubleClick(scene, { clientX: 150, clientY: 170 });
    jest.advanceTimersByTime(300);

    expect(mockController.rippleAt).not.toHaveBeenCalled();
    expect(mockController.dissolveAt).toHaveBeenCalledWith(150, 170);
    expect(document.querySelector(".heart-case-card")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
  });

  it("reforms the heart from the case card", () => {
    render(<HeroVisualScene />);
    const scene = screen.getByRole("group", {
      name: /interactive red particle heart/i,
    });

    fireEvent.doubleClick(scene, { clientX: 150, clientY: 170 });
    fireEvent.click(screen.getByRole("button", { name: /back to heart/i }));

    expect(mockController.reform).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".heart-case-card")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
