import { act, createEvent, fireEvent, render, screen } from "@testing-library/react";
import { HeroVisualScene } from "@/components/brain/hero-visual-scene";

const mockController = {
  pointerMove: jest.fn(),
  pointerLeave: jest.fn(),
  rippleAt: jest.fn(),
  setDissolveOrigin: jest.fn(),
};

jest.mock("framer-motion", () => ({
  useReducedMotion: () => false,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const React = jest.requireActual<typeof import("react")>("react");
    return React.createElement("a", { href, ...props }, children);
  },
}));

jest.mock("gsap", () => {
  const createTimeline = () => {
    const timeline = {
      to: jest.fn(),
      play: jest.fn(),
      reverse: jest.fn(),
      kill: jest.fn(),
    };
    timeline.to.mockReturnValue(timeline);
    return timeline;
  };

  return {
    gsap: {
      context: (callback: () => void) => {
        callback();
        return { revert: jest.fn() };
      },
      set: jest.fn(),
      timeline: createTimeline,
    },
  };
});

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const React = jest.requireActual<typeof import("react")>("react");

    return function MockParticleHeartCanvas({
      controllerRef,
      mode,
    }: {
      controllerRef: React.Ref<unknown>;
      mode: string;
    }) {
      React.useImperativeHandle(controllerRef, () => mockController);
      return <div data-testid="particle-heart-canvas" data-mode={mode} />;
    };
  },
}));

describe("HeroVisualScene", () => {
  function pointerUp(element: Element, clientX: number, clientY: number) {
    const event = createEvent.pointerUp(element);
    Object.defineProperties(event, {
      clientX: { value: clientX },
      clientY: { value: clientY },
      pointerType: { value: "mouse" },
      button: { value: 0 },
    });
    fireEvent(element, event);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it("arbitrates a single pointer gesture into one ripple", () => {
    render(<HeroVisualScene />);
    const scene = screen.getByRole("button", { name: /interactive particle heart/i });

    pointerUp(scene, 120, 160);
    act(() => jest.advanceTimersByTime(289));
    expect(mockController.rippleAt).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1));
    expect(mockController.rippleAt).toHaveBeenCalledTimes(1);
  });

  it("cancels the pending ripple on a double gesture and reveals the case", () => {
    render(<HeroVisualScene />);
    const scene = screen.getByRole("button", { name: /interactive particle heart/i });

    pointerUp(scene, 120, 160);
    act(() => jest.advanceTimersByTime(90));
    pointerUp(scene, 124, 164);

    expect(mockController.rippleAt).not.toHaveBeenCalled();
    expect(mockController.setDissolveOrigin).toHaveBeenCalledTimes(1);
    expect(scene).toHaveAttribute("data-state", "case");
    expect(screen.getByText("The rhythm changed before the room did.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /reform heart/i }));
    expect(scene).toHaveAttribute("data-state", "heart");
  });

  it("reveals the case from the keyboard", () => {
    render(<HeroVisualScene />);
    const scene = screen.getByRole("button", { name: /interactive particle heart/i });

    fireEvent.keyDown(scene, { key: "Enter" });

    expect(mockController.setDissolveOrigin).toHaveBeenCalledTimes(1);
    expect(scene).toHaveAttribute("data-state", "case");
  });
});
