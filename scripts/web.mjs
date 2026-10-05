import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const [command, ...args] = process.argv.slice(2);
if (!["dev", "build", "start"].includes(command)) {
  console.error("Usage: node scripts/web.mjs <dev|build|start> [Next.js options]");
  process.exit(1);
}
const child = spawn(process.execPath, [
  require.resolve("next/dist/bin/next"), command,
  ...(command === "build" ? [] : ["--hostname", "127.0.0.1"]), ...args,
], {
  cwd: fileURLToPath(new URL("../apps/web/", import.meta.url)),
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
