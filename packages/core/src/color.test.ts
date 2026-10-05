import { describe, it, expect } from "vitest";
import { normalizeColor, normalizeOccurrences } from "./color";
import { contrastRatio, contrastChecks } from "./contrast";
describe("normalization and conversion", () => {
  it("deduplicates equivalent CSS syntax", () => {
    const colors = ["#fff", "#ffffff", "rgb(255 255 255)", "hsl(0 0% 100%)"];
    expect(new Set(colors.map((c) => normalizeColor(c)!.id)).size).toBe(1);
  });
  it("converts known red to OKLCH and back", () => {
    const red = normalizeColor("#f00")!;
    expect(red.oklch.l).toBeCloseTo(0.627955, 5);
    expect(red.oklch.c).toBeCloseTo(0.257683, 5);
    expect(normalizeColor(red.css)!.hex).toBe("#ff0000");
  });
  it("retains alpha and ignores transparency/invalid CSS", () => {
    expect(normalizeColor("rgb(255 0 0 / .5)")!.alpha).toBe(0.5);
    expect(normalizeColor("transparent")).toBeNull();
    expect(normalizeColor("not-a-color")).toBeNull();
  });
  it("preserves wide gamut originals rather than silently clipping", () => {
    const color = normalizeColor("color(display-p3 1 0 0)")!;
    expect(color.inSrgbGamut).toBe(false);
    expect(color.srgb.r).toBeGreaterThan(1);
  });
  it("counts rendered property occurrences without counting variable declarations", () => {
    const colors = normalizeOccurrences([
      {
        originalValue: "#fff",
        cssProperty: "color",
        elementTypes: ["p"],
        count: 3,
        kind: "rendered",
      },
      {
        originalValue: "white",
        cssProperty: "--neutral-25",
        cssVariableName: "--neutral-25",
        elementTypes: ["html"],
        count: 1,
        kind: "variable",
      },
    ]);
    expect(colors).toHaveLength(1);
    expect(colors[0].usageCount).toBe(3);
    expect(colors[0].sources).toHaveLength(2);
  });
});
describe("WCAG contrast", () => {
  it("matches known ratios", () => {
    expect(contrastRatio("#000", "#fff")).toBe(21);
    expect(contrastRatio("#777", "#fff")).toBeCloseTo(4.478, 3);
    expect(contrastRatio("#fff", "#fff")).toBe(1);
  });
  it("does not round failing ratios into passes", () => {
    expect(contrastChecks(4.4999).aaNormal).toBe(false);
    expect(contrastChecks(4.5).aaNormal).toBe(true);
    expect(contrastChecks(3).ui).toBe(true);
    expect(contrastChecks(7).aaaNormal).toBe(true);
  });
  it("composites transparency on the actual background and canvas", () => {
    expect(contrastRatio("rgb(0 0 0 / .5)", "#fff")).toBeCloseTo(3.97665, 4);
    expect(contrastRatio("#fff", "rgb(255 255 255 / .5)", "#000")).toBeCloseTo(
      3.97665,
      4,
    );
  });
});
