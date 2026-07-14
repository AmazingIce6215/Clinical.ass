import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getModuleByPath, moduleGroups, modules } from "@/lib/modules";

const root = process.cwd();

describe("DxFlow redesign contract", () => {
  test("uses the central module registry for every workspace section", () => {
    expect(moduleGroups.map((group) => group.label)).toEqual([
      "Practice",
      "Tools",
      "Workspace",
      "Progress",
    ]);
    expect(modules.map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "clinical",
        "classic",
        "teaching",
        "osce",
        "image-diagnosis",
        "calculators",
        "library",
        "stats",
      ]),
    );
    expect(getModuleByPath("/calculators/heart-score")?.id).toBe("calculators");
  });

  test("standardizes display branding while retaining compatibility identifiers", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(root, "public/manifest.json"), "utf8"),
    ) as { name: string; short_name: string };
    const capacitor = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");

    expect(manifest.name).toBe("DxFlow");
    expect(manifest.short_name).toBe("DxFlow");
    expect(capacitor).toContain("appName: 'DxFlow'");
    expect(capacitor).toContain("appId: 'com.clincalass.app'");
    expect(capacitor).toContain("https://clinicalass.vercel.app");
  });

  test("removes decorative heart and WebGL implementation without removing the HEART Score", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(root, "package.json"), "utf8"),
    ) as { dependencies: Record<string, string> };
    const calculatorRegistry = readFileSync(
      resolve(root, "src/lib/calculators/registry.ts"),
      "utf8",
    );

    expect(existsSync(resolve(root, "src/components/brain"))).toBe(false);
    expect(existsSync(resolve(root, "public/models/xbot.glb"))).toBe(false);
    expect(packageJson.dependencies).not.toHaveProperty("three");
    expect(packageJson.dependencies).not.toHaveProperty("@react-three/fiber");
    expect(packageJson.dependencies).not.toHaveProperty("@react-three/drei");
    expect(packageJson.dependencies).not.toHaveProperty("gsap");
    expect(packageJson.dependencies).not.toHaveProperty("simplex-noise");
    expect(calculatorRegistry).toContain("heart");
  });
});
