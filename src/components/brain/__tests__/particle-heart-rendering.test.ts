import { readFileSync } from "node:fs";
import { join } from "node:path";

const canvasSource = readFileSync(
  join(process.cwd(), "src/components/brain/particle-heart-canvas.tsx"),
  "utf8",
);
const shaderSource = readFileSync(
  join(process.cwd(), "src/components/brain/particle-heart-shaders.ts"),
  "utf8",
);

describe("particle heart rendering safeguards", () => {
  it("uses the transparent R3F render loop without post-processing", () => {
    expect(canvasSource).not.toMatch(/EffectComposer|RenderPass|UnrealBloomPass|BloomComposer/);
    expect(canvasSource).not.toContain("three/addons/postprocessing");
    expect(canvasSource).toContain("blending={THREE.NormalBlending}");
    expect(canvasSource).toContain("blending={THREE.AdditiveBlending}");
  });

  it("keeps the halo contained and the red particles visibly alive", () => {
    expect(canvasSource).toContain('rgba(70, 0, 13, 0.97)');
    expect(canvasSource).toContain('rgba(44, 0, 9, 0.75)');
    expect(canvasSource).toContain('gradient.addColorStop(0.92, "rgba(5, 0, 2, 0)")');
    expect(canvasSource).toContain("createHeartUniforms(pixelRatio, 0.9, 0)");
    expect(canvasSource).toContain("const yawAmplitude = reducedMotion ? 0.06 : 0.16");
    expect(canvasSource).toContain("const yawFrequency = reducedMotion ? 0.12 : 0.31");
    expect(shaderSource).toContain("mix(0.032, 0.045, uRim)");
    expect(shaderSource).toContain("0.34 + vDepth");
    expect(shaderSource).toContain("float rippleActive");
    expect(shaderSource).not.toMatch(/float\s+active\b/);
  });

  it("reports WebGL loss and restoration through the readiness gate", () => {
    expect(canvasSource).toContain('addEventListener("webglcontextlost"');
    expect(canvasSource).toContain('addEventListener("webglcontextrestored"');
    expect(canvasSource).toContain("onReadyChange(false)");
    expect(canvasSource).toContain("onReadyChange(true)");
  });
});
