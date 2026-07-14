import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getModuleByPath, moduleGroups, modules } from "@/lib/modules";

const root = process.cwd();

describe("Wardly redesign contract", () => {
  test("uses the central module registry for every workspace section", () => {
    expect(moduleGroups.map((group) => group.label)).toEqual([
      "Tools",
      "Practice",
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
    expect(modules.filter((module) => module.group === "tools").map((module) => module.id)).toEqual([
      "clinical",
      "image-diagnosis",
      "classic",
      "calculators",
    ]);
    expect(modules.filter((module) => module.featured).map((module) => module.id)).toEqual([
      "clinical",
      "image-diagnosis",
    ]);
    expect(getModuleByPath("/calculators/heart-score")?.id).toBe("calculators");
  });

  test("standardizes display branding while retaining compatibility identifiers", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(root, "public/manifest.json"), "utf8"),
    ) as { name: string; short_name: string };
    const packageJson = JSON.parse(
      readFileSync(resolve(root, "package.json"), "utf8"),
    ) as { name: string };
    const capacitor = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
    const infoPlist = readFileSync(resolve(root, "ios/App/App/Info.plist"), "utf8");
    const appIcon = readFileSync(resolve(root, "src/app/icon.svg"), "utf8");

    expect(manifest.name).toBe("Wardly");
    expect(manifest.short_name).toBe("Wardly");
    expect(packageJson.name).toBe("wardly");
    expect(capacitor).toContain("appName: 'Wardly'");
    expect(infoPlist).toContain("<string>Wardly</string>");
    expect(appIcon).toContain('aria-label="Wardly"');
    expect(appIcon).not.toContain("DxFlow");
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

  test("keeps Supabase profile writes owner-only and display names non-unique", () => {
    const migration = readFileSync(
      resolve(root, "supabase/migrations/00005_fix_auth_profile_security.sql"),
      "utf8",
    );

    expect(migration).toContain("drop constraint if exists profiles_first_name_key");
    expect(migration).toContain("to authenticated");
    expect(migration).toContain("with check ((select auth.uid()) = id)");
    expect(migration).toContain("revoke all on table public.profiles from anon");
    expect(migration).not.toContain("using (true)");
  });
});
