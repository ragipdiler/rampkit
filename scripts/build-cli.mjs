import { build } from "esbuild";
import { chmod } from "node:fs/promises";
await build({
  entryPoints: ["packages/cli/src/index.ts"],
  outfile: "dist/cli.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external: ["playwright"],
  sourcemap: true,
});
await chmod("dist/cli.js", 0o755);
