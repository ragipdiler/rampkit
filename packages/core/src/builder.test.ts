import { describe, it, expect } from "vitest";
import { normalizeColor } from "./color";
import { curateSourceColors, manualSource } from "./sources";
import {
  createPalette,
  createCustomPalette,
  editPaletteStop,
  toggleStopLock,
  regeneratePalette,
  palettesToPrimitives,
} from "./palettes";
import type { Anchor } from "./models";
const anchor = (step: Anchor["step"], value: string): Anchor => ({
  step,
  color: normalizeColor(value)!,
  origin: "manual",
  locked: true,
});
describe("curated sources", () => {
  it("groups alpha variants and retains exact evidence", () => {
    const raw = [
      "#262626",
      "#262626b8",
      "#262626a3",
      "#26262652",
      "#2626260d",
    ].map((c) => normalizeColor(c)!);
    const curated = curateSourceColors(raw);
    expect(curated).toHaveLength(1);
    expect(curated[0].color.hex).toBe("#262626");
    expect(curated[0].variants).toHaveLength(5);
    expect(raw[1].alpha).not.toBe(1);
  });
  it("groups near-identical colors without deleting originals", () => {
    const sources = curateSourceColors(
      ["#262626", "#272727"].map((c) => normalizeColor(c)!),
    );
    expect(sources).toHaveLength(1);
    expect(sources[0].variants).toHaveLength(2);
  });
  it("supports manual HEX, RGB, OKLCH without extraction", () => {
    for (const value of ["#7c3aed", "rgb(124 58 237)", "oklch(.6 .2 285)"])
      expect(manualSource(value).origin).toBe("manual");
    expect(() => manualSource("bad")).toThrow();
  });
});
describe("user-controlled palette generation", () => {
  it("preserves two exact anchors and fills twelve positions", () => {
    const a = anchor(50, "#f9f9f9"),
      b = anchor(800, "#262626");
    const palette = createPalette("Neutral", [a, b]);
    expect(palette.stops).toHaveLength(12);
    expect(palette.stops.find((s) => s.step === 50)!.color).toBe(a.color);
    expect(palette.stops.find((s) => s.step === 800)!.color).toBe(b.color);
    expect(
      palette.stops.every(
        (s, i, all) => i === 0 || s.color.oklch.l < all[i - 1].color.oklch.l,
      ),
    ).toBe(true);
  });
  it("keeps locked generated stops and manually edited anchors unchanged", () => {
    let palette = createPalette("Orange", [anchor(500, "#ff4d00")]);
    palette = toggleStopLock(palette, 200);
    const locked = palette.stops.find((s) => s.step === 200)!.color;
    palette = editPaletteStop(palette, 800, "#772200");
    expect(palette.stops.find((s) => s.step === 800)!.source).toBe("anchor");
    const regenerated = regeneratePalette({
      ...palette,
      settings: { ...palette.settings, chroma: "muted" },
    });
    expect(regenerated.stops.find((s) => s.step === 500)!.color.hex).toBe(
      "#ff4d00",
    );
    expect(regenerated.stops.find((s) => s.step === 200)!.color).toBe(locked);
    expect(regenerated.stops.find((s) => s.step === 800)!.color.hex).toBe(
      "#772200",
    );
  });
  it("regenerates unlocked edits and is deterministic", () => {
    let p = createPalette("Brand", [anchor(500, "#7c3aed")]);
    p = editPaletteStop(p, 800, "#222222");
    p = toggleStopLock(p, 800);
    const a = regeneratePalette(p),
      b = regeneratePalette(p);
    expect(a).toEqual(b);
    expect(a.stops.find((s) => s.step === 800)!.source).toBe("generated");
    expect(a.stops.find((s) => s.step === 800)!.color.hex).not.toBe("#222222");
    expect(p.stops.find((s) => s.step === 800)!.color.hex).toBe("#222222");
  });
  it("creates tokens only from explicit palettes, including locks and manual origin", () => {
    expect(palettesToPrimitives([])).toEqual([]);
    const p = createPalette("Brand", [anchor(500, "#7c3aed")]);
    expect(palettesToPrimitives([p])).toHaveLength(12);
    expect(palettesToPrimitives([p]).find((t) => t.step === 500)!.source).toBe(
      "manual",
    );
    expect(() => palettesToPrimitives([p, { ...p, id: "other" }])).toThrow();
  });
  it("rejects duplicate positions and regeneration with no locked constraint", () => {
    expect(() =>
      createPalette("Neutral", [anchor(50, "#fff"), anchor(50, "#eee")]),
    ).toThrow();
    const p = toggleStopLock(
      createPalette("Brand", [anchor(500, "#7c3aed")]),
      500,
    );
    expect(() => regeneratePalette(p)).toThrow("Keep at least one");
  });
});

describe("exact custom palettes", () => {
  it("keeps two colors, alpha and order through edit, regeneration and token conversion", () => {
    const colors = [normalizeColor("#ff000080")!, normalizeColor("#0000ff")!];
    const palette = createCustomPalette("Duo", colors);
    expect(palette.stops.map((stop) => stop.color)).toEqual(colors);
    expect(palette.anchors).toEqual([]);
    expect(regeneratePalette(palette)).toBe(palette);
    expect(toggleStopLock(palette, 1)).toBe(palette);
    const edited = editPaletteStop(palette, 2, "#00ff00");
    expect(edited.stops).toHaveLength(2);
    expect(edited.stops[0].color).toBe(colors[0]);
    expect(edited.stops[1].color.hex).toBe("#00ff00");
    expect(palettesToPrimitives([edited]).map((token) => token.name)).toEqual([
      "duo-1",
      "duo-2",
    ]);
    expect(palettesToPrimitives([edited])[0].color.alpha).toBe(colors[0].alpha);
  });
  it("supports more than twelve colors and rejects empty or oversized collections", () => {
    const color = normalizeColor("#fafafa")!;
    expect(
      createCustomPalette("Long", Array(30).fill(color)).stops,
    ).toHaveLength(30);
    expect(() => createCustomPalette("Empty", [])).toThrow();
    expect(() => createCustomPalette("Huge", Array(257).fill(color))).toThrow();
  });
});
