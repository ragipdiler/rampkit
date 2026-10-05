import type { ExportFormat } from "../../tokens/src/export";
export function parseArgs(args: string[]): {
  url?: string;
  format?: ExportFormat;
  out: string;
  help: boolean;
  anchors: string[];
} {
  let url: string | undefined,
    format: ExportFormat | undefined,
    out = "rampkit",
    help = false;
  const anchors: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg === "--anchor") {
      const value = args[++i];
      if (
        !value ||
        !/^([^:]+):(25|50|100|200|300|400|500|600|700|800|900|950):(.+)$/.test(
          value,
        )
      )
        throw new Error(
          "--anchor requires Name:position:color, for example Orange:500:#ff4d00.",
        );
      anchors.push(value);
      continue;
    }
    if (arg === "--format") {
      const value = args[++i];
      if (!["css", "json", "tailwind", "w3c"].includes(value))
        throw new Error("--format must be css, json, tailwind, or w3c.");
      format = value as ExportFormat;
      continue;
    }
    if (arg === "--out") {
      out = args[++i];
      if (!out || out.startsWith("--"))
        throw new Error("--out requires a directory.");
      continue;
    }
    if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    if (url) throw new Error("Supply only one website URL.");
    url = arg;
  }
  if (!url && !anchors.length && !help)
    throw new Error(
      "Supply a website URL or explicit --anchor. Use --help for usage.",
    );
  return { url, format, out, help, anchors };
}
