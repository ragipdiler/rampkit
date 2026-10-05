import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["playwright", "playwright-core"],
};
export default config;
