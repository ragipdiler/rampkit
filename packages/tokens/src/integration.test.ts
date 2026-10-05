import { expect, it } from "vitest";
import { normalizeColor } from "../../core/src/color";
import { createPalette } from "../../core/src/palettes";
import { buildTokenSystem } from "./system";
import { createIntegrationPrompt, integrationSystem } from "./integration";
const blue = createPalette("Blue", [
  {
    step: 500,
    color: normalizeColor("#2679f3")!,
    origin: "manual",
    locked: true,
  },
]);
const neutral = createPalette("Neutral", [
  {
    step: 800,
    color: normalizeColor("#262626")!,
    origin: "manual",
    locked: true,
  },
]);
const system = buildTokenSystem(
  [blue, neutral],
  [
    {
      name: "text-primary",
      theme: "light",
      primitiveToken: "neutral-800",
      reason: "User choice",
    },
    {
      name: "text-primary",
      theme: "dark",
      primitiveToken: "neutral-25",
      reason: "User choice",
    },
    {
      name: "surface-primary",
      theme: "light",
      primitiveToken: null,
      reason: "Not mapped",
    },
  ],
);
it("hands off exact primitives, independent mappings and unresolved roles without changing data", () => {
  const before = JSON.stringify(system);
  const prompt = createIntegrationPrompt(system);
  expect(prompt).toContain(`--blue-500: ${blue.anchors[0].color.css}`);
  expect(prompt).toContain("--text-primary: var(--neutral-800)");
  expect(prompt).toContain("--text-primary: var(--neutral-25)");
  expect(prompt).toContain("light/surface-primary");
  expect(prompt).toContain("do not invent or silently apply mappings");
  expect(JSON.stringify(system)).toBe(before);
});
it("palette scope excludes unrelated colors and never implies saved semantic roles", () => {
  const report = integrationSystem(system, blue.id);
  expect(report.primitives.every((p) => p.family === "blue")).toBe(true);
  expect(report.semantics).toEqual([]);
  const prompt = createIntegrationPrompt(system, {
    paletteId: blue.id,
    target: "claude",
    format: "tailwind",
  });
  expect(prompt).toContain("Claude Code");
  expect(prompt).toContain("@theme inline");
  expect(prompt).toContain("palette-only handoff");
  expect(prompt).not.toContain("--neutral-");
});
it("rejects missing palette scopes and empty systems", () => {
  expect(() => integrationSystem(system, "missing")).toThrow(
    "no longer available",
  );
  expect(() => createIntegrationPrompt(buildTokenSystem([]))).toThrow(
    "Create a palette first",
  );
});
