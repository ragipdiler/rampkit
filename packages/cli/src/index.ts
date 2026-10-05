#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { analyzeWebsite } from "../../extractor/src/analyze";
import {
  exportTokens,
  EXPORT_FORMATS,
  type ExportFormat,
} from "../../tokens/src/export";
import { buildTokenSystem } from "../../tokens/src/system";
import { createPalette } from "../../core/src/palettes";
import { normalizeColor } from "../../core/src/color";
import type { Anchor } from "../../core/src/models";
import { parseArgs } from "./args";
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      'Rampkit — color system builder\n\nDiscover: rampkit <url> [--out directory]\nBuild: rampkit --anchor "Orange:500:#ff4d00" [--anchor "Orange:800:#772200"]\n       [--format css|json|tailwind|w3c] [--out directory]\n\nWebsite analysis writes source candidates, not automatic tokens. Explicit anchors create palettes.',
    );
    return;
  }
  const abort = new AbortController();
  const interrupt = () => abort.abort();
  process.once("SIGINT", interrupt);
  try {
    const source = args.url
      ? await analyzeWebsite(
          args.url,
          (stage) => console.log(stage),
          abort.signal,
        )
      : null;
    const directory = resolve(
      args.out,
      source?.hostname.replace(/[^a-zA-Z0-9.-]/g, "_") ?? "manual",
    );
    await mkdir(directory, { recursive: true });
    const paths: string[] = [];
    if (source) {
      const path = join(directory, "sources.json");
      await writeFile(path, JSON.stringify(source, null, 2) + "\n");
      paths.push(path);
      console.log(
        `\n${source.stats.useful} useful source colors. No palettes created automatically.`,
      );
    }
    if (args.anchors.length) {
      const groups = new Map<string, Anchor[]>();
      for (const value of args.anchors) {
        const match = value.match(/^([^:]+):(\d+):(.+)$/)!;
        const color = normalizeColor(match[3]);
        if (!color) throw new Error(`Invalid anchor color: ${match[3]}`);
        const anchors = groups.get(match[1]) ?? [];
        anchors.push({
          step: Number(match[2]) as Anchor["step"],
          color,
          origin: "manual",
          locked: true,
        });
        groups.set(match[1], anchors);
      }
      const palettes = [...groups].map(([name, anchors]) =>
        createPalette(name, anchors),
      );
      const system = buildTokenSystem(palettes);
      for (const format of args.format
        ? [args.format]
        : (["css", "json"] as ExportFormat[])) {
        const path = join(directory, EXPORT_FORMATS[format].file);
        await writeFile(path, exportTokens(system, format));
        paths.push(path);
      }
      const report = join(directory, "report.json");
      await writeFile(report, JSON.stringify(system, null, 2) + "\n");
      paths.push(report);
      console.log(
        `${palettes.length} explicitly chosen palettes · ${system.primitives.length} primitive tokens. Semantic mappings are unresolved until chosen in the UI.`,
      );
    }
    console.log(
      `\nOutput written to:\n${paths.map((p) => `  ${p}`).join("\n")}`,
    );
  } finally {
    process.removeListener("SIGINT", interrupt);
  }
}
main().catch((error) => {
  console.error(
    `Rampkit: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
