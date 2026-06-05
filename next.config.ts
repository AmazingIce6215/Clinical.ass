import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["groq-sdk"],
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
