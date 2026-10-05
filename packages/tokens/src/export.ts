import type { Theme } from "../../core/src/models";
import type { TokenSystem } from "./system";
export type ExportFormat = "css" | "json" | "tailwind" | "w3c";
export const EXPORT_FORMATS: Record<
  ExportFormat,
  { label: string; file: string; mime: string }
> = {
  css: { label: "CSS variables", file: "tokens.css", mime: "text/css" },
  json: { label: "JSON", file: "tokens.json", mime: "application/json" },
  tailwind: {
    label: "Tailwind CSS v4 theme",
    file: "tailwind.css",
    mime: "text/css",
  },
  w3c: {
    label: "W3C-style design tokens",
    file: "design-tokens.json",
    mime: "application/json",
  },
};
function css(report: TokenSystem): string {
  const primitive = report.primitives
    .map((t) => `  --${t.name}: ${t.color.css}; /* ${t.source} */`)
    .join("\n");
  const semantic = (theme: Theme) =>
    report.semantics
      .filter((t) => t.theme === theme)
      .map((t) =>
        t.primitiveToken
          ? `  --${t.name}: var(--${t.primitiveToken});`
          : `  /* ${t.name}: unresolved */`,
      )
      .join("\n");
  return `/* Rampkit · extracted anchors are preserved; generated stops are labeled. */\n:root {\n${primitive}\n\n${semantic("light")}\n}\n\n.dark {\n${semantic("dark")}\n}\n`;
}
export function exportTokens(
  report: TokenSystem,
  format: ExportFormat,
): string {
  if (format === "css") return css(report);
  if (format === "tailwind") {
    const names = [
      ...report.primitives.map((t) => t.name),
      ...report.semantics
        .filter((t) => t.theme === "light" && t.primitiveToken)
        .map((t) => t.name),
    ];
    return `${css(report)}\n/* Import after @import "tailwindcss" in Tailwind CSS v4. */\n@custom-variant dark (&:where(.dark, .dark *));\n@theme inline {\n${names.map((name) => `  --color-${name}: var(--${name});`).join("\n")}\n}\n`;
  }
  if (format === "json")
    return (
      JSON.stringify(
        {
          version: 2,
          palettes: report.palettes,
          primitives: report.primitives.map((t) => ({
            name: t.name,
            family: t.family,
            step: t.step,
            source: t.source,
            confidence: t.confidence,
            locked: t.locked,
            value: {
              hex: t.color.hex,
              rgb: t.color.rgb,
              oklch: t.color.oklch,
              alpha: t.color.alpha,
              css: t.color.css,
            },
          })),
          themes: Object.fromEntries(
            (["light", "dark"] as const).map((theme) => [
              theme,
              Object.fromEntries(
                report.semantics
                  .filter((t) => t.theme === theme)
                  .map((t) => [t.name, t.primitiveToken]),
              ),
            ]),
          ),
        },
        null,
        2,
      ) + "\n"
    );
  if (format === "w3c")
    return (
      JSON.stringify(
        {
          primitives: Object.fromEntries(
            report.primitives.map((t) => [
              t.name,
              {
                $type: "color",
                $value: {
                  colorSpace: "oklch",
                  components: [
                    t.color.oklch.l,
                    t.color.oklch.c,
                    t.color.oklch.h ?? "none",
                  ],
                  alpha: t.color.alpha,
                },
                $extensions: {
                  "org.rampkit": {
                    source: t.source,
                    confidence: t.confidence,
                    locked: t.locked,
                  },
                },
              },
            ]),
          ),
          themes: Object.fromEntries(
            (["light", "dark"] as const).map((theme) => [
              theme,
              Object.fromEntries(
                report.semantics
                  .filter((t) => t.theme === theme && t.primitiveToken)
                  .map((t) => [
                    t.name,
                    {
                      $type: "color",
                      $value: `{primitives.${t.primitiveToken}}`,
                    },
                  ]),
              ),
            ]),
          ),
          $extensions: {
            "org.rampkit": {
              unresolved: report.semantics
                .filter((t) => !t.primitiveToken)
                .map((t) => ({
                  name: t.name,
                  theme: t.theme,
                  reason: t.reason,
                })),
            },
          },
        },
        null,
        2,
      ) + "\n"
    );
  throw new Error("Unsupported export format.");
}
