import { describe, it, expect } from "vitest";
import { normalizeColor } from "../../core/src/color";
import { detectFamilies, inferPositions } from "../../core/src/families";
import { generatePrimitives } from "../../core/src/scales";
import {
  generateSemantics,
  validateSemantics,
  suggestContrast,
} from "./semantic";
const primitives = generatePrimitives(
  inferPositions(
    detectFamilies(
      ["#fff", "#000", "#6c47ff"].map((value) => normalizeColor(value)!),
    ),
  ),
);
describe("semantic mappings and suggestions", () => {
  it("shares primitives but maps separate theme hierarchy", () => {
    const semantics = generateSemantics(primitives);
    expect(semantics).toHaveLength(56);
    expect(
      semantics.find(
        (t) => t.theme === "light" && t.name === "background-primary",
      )!.primitiveToken,
    ).toBe("neutral-25");
    expect(
      semantics.find(
        (t) => t.theme === "dark" && t.name === "background-primary",
      )!.primitiveToken,
    ).toBe("neutral-950");
  });
  it("leaves missing status families unresolved", () => {
    expect(
      generateSemantics(primitives)
        .filter((t) => t.name === "success")
        .every((t) => t.primitiveToken === null),
    ).toBe(true);
  });
  it("validates both themes and reports honest failures", () => {
    const results = validateSemantics(
      generateSemantics(primitives),
      primitives,
    );
    expect(new Set(results.map((t) => t.theme)).size).toBe(2);
    expect(
      results
        .filter((t) => t.foreground === "text-primary")
        .every((t) => t.checks.aaaNormal),
    ).toBe(true);
    expect(results.some((t) => !t.pass)).toBe(true);
    expect(
      results
        .filter((t) => !t.pass && t.suggestion)
        .every((t) => t.suggestion!.ratio >= (t.criterion === "ui" ? 3 : 4.5)),
    ).toBe(true);
  });
  it("suggests an existing token without modifying the palette", () => {
    const copy = JSON.stringify(primitives);
    const fg = primitives.find((t) => t.name === "neutral-100")!,
      bg = primitives.find((t) => t.name === "neutral-25")!;
    const suggestion = suggestContrast(fg, bg, primitives, 4.5, "light");
    expect(suggestion!.ratio).toBeGreaterThanOrEqual(4.5);
    expect(primitives.some((t) => t.name === suggestion!.token)).toBe(true);
    expect(JSON.stringify(primitives)).toBe(copy);
  });
});

it("checks secondary action foreground in every state without changing mappings", () => {
  const semantics = generateSemantics(primitives);
  const snapshot = JSON.stringify(semantics);
  const checks = validateSemantics(semantics, primitives).filter(
    (check) => check.foreground === "action-secondary-foreground",
  );
  expect(checks).toHaveLength(6);
  expect(checks.every((check) => check.ratio > 0)).toBe(true);
  expect(JSON.stringify(semantics)).toBe(snapshot);
});
