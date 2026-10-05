import { expect, it } from "vitest";
import {
  normalizeColor,
  detectFamilies,
  inferPositions,
  generatePrimitives,
  type AnalysisReport,
} from "../../core/src/index";
import { generateSemantics, validateSemantics } from "./semantic";
import { exportTokens } from "./export";
const colors = ["#fff", "#000", "#6c47ff"].map((c) => normalizeColor(c)!);
const families = inferPositions(detectFamilies(colors));
const primitives = generatePrimitives(families);
const semantics = generateSemantics(primitives);
const report: AnalysisReport = {
  url: "https://example.com",
  hostname: "example.com",
  colors,
  families,
  primitives,
  semantics,
  contrast: validateSemantics(semantics, primitives),
  warnings: [],
  stats: {
    discovered: 3,
    unique: 3,
    families: 2,
    generated: 21,
    contrastIssues: 0,
  },
};
it("exports aliases, both themes and source labels in CSS", () => {
  const css = exportTokens(report, "css");
  expect(css).toContain("--text-primary: var(--neutral-950)");
  expect(css).toContain(".dark");
  expect(css).toContain("/* generated */");
  expect(css).toContain("/* success: unresolved */");
});
it("exports valid JSON without losing provenance", () => {
  const json = JSON.parse(exportTokens(report, "json"));
  expect(
    json.primitives.some((t: { source: string }) => t.source === "generated"),
  ).toBe(true);
  expect(json.themes.dark["text-primary"]).toBe("neutral-25");
  expect(json.themes.light.success).toBeNull();
});
it("exports Tailwind v4 references to live semantic variables", () => {
  expect(exportTokens(report, "tailwind")).toContain(
    "--color-text-primary: var(--text-primary)",
  );
  expect(exportTokens(report, "tailwind")).toContain("@theme inline");
});
it("exports structured DTCG colors and resolvable aliases", () => {
  const json = JSON.parse(exportTokens(report, "w3c"));
  expect(json.primitives["neutral-25"].$value.colorSpace).toBe("oklch");
  expect(json.themes.light["text-primary"].$value).toBe(
    "{primitives.neutral-950}",
  );
  expect(json.themes.light.success).toBeUndefined();
  expect(json.$extensions["org.rampkit"].unresolved.length).toBeGreaterThan(0);
});
