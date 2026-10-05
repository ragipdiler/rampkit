import { describe, it, expect } from "vitest";
import { PaintField, mixPigments, type PaintStroke } from "./painting";
const point = (x: number, y = 0) => ({ x, y, pressure: 0.7, time: 1000 });
const stroke = (pigment: string): PaintStroke => ({
  pigment,
  brush: "round",
  size: 48,
  load: 0.8,
  wetness: 0.9,
  blend: false,
  points: [point(0), point(60)],
});
describe("atelier pigment field", () => {
  it("mixes blue and yellow into green rather than RGB gray", () => {
    const result = mixPigments("#002185", "#fcd200", 0.5);
    const rgb = result
      .slice(1)
      .match(/../g)!
      .map((v) => parseInt(v, 16));
    expect(rgb[1]).toBeGreaterThan(rgb[0]);
    expect(rgb[1]).toBeGreaterThan(rgb[2]);
    expect(mixPigments("#002185", "#fcd200", 0)).toBe("#002185");
    expect(mixPigments("#002185", "#fcd200", 1)).toBe("#fcd200");
  });
  it("replays organic marks deterministically and preserves inputs", () => {
    const strokes = [stroke("#002185"), stroke("#fcd200")];
    const original = JSON.stringify(strokes);
    const a = new PaintField(),
      b = new PaintField();
    a.replay(strokes);
    b.replay(strokes);
    expect([...a.cells]).toEqual([...b.cells]);
    expect(JSON.stringify(strokes)).toBe(original);
    expect(a.sample(20, 0)).not.toBe("#002185");
    expect(a.sample(1000, 1000)).toBeNull();
  });
  it("captures only colors actually on the painted field", () => {
    const field = new PaintField();
    field.replay([stroke("#002185")]);
    const found = field.gradient(point(0), point(60));
    expect(found.length).toBeGreaterThan(0);
    for (const hex of found)
      expect(
        [...field.cells.values()].some((c) => field.sample(c.x, c.y) === hex),
      ).toBe(true);
    expect(field.gradient(point(1000), point(1100))).toEqual([]);
  });
  it("responds to pressure and blending does not paint empty paper", () => {
    const small = new PaintField(),
      large = new PaintField();
    const paint = stroke("#c74329");
    small.stamp({ ...point(0), pressure: 0.1 }, paint);
    large.stamp({ ...point(0), pressure: 1 }, paint);
    expect(large.cells.size).toBeGreaterThan(small.cells.size);
    const blank = new PaintField();
    blank.stamp(point(0), { ...paint, blend: true });
    expect(blank.cells.size).toBe(0);
  });
  it("gathers distinct colors from the whole painting without inventing samples", () => {
    const field = new PaintField();
    field.replay([
      stroke("#002185"),
      { ...stroke("#c74329"), points: [point(200), point(260)] },
    ]);
    const colors = field.gather();
    expect(colors.length).toBeGreaterThan(1);
    expect(colors.length).toBeLessThanOrEqual(12);
    expect(field.gather()).toEqual(colors);
    const actual = new Set([...field.cells.values()].map((c) => c.display));
    expect(colors.every((hex) => actual.has(hex))).toBe(true);
    expect(new PaintField().gather()).toEqual([]);
  });
  it("wet overlap blends more than a dry overpaint and wash remains translucent", () => {
    const base = stroke("#002185"),
      yellow = stroke("#fcd200");
    const wet = new PaintField(),
      dry = new PaintField(),
      wash = new PaintField();
    wet.replay([base, yellow]);
    dry.replay([
      base,
      {
        ...yellow,
        points: yellow.points.map((p) => ({ ...p, time: p.time + 900000 })),
      },
    ]);
    expect(wet.sample(20, 0)).not.toBe(dry.sample(20, 0));
    wash.stamp(point(0), { ...base, brush: "wash" });
    expect([...wash.cells.values()].every((c) => c.opacity < 0.2)).toBe(true);
  });
  it("picker opacity affects deposition and legacy strokes remain fully opaque", () => {
    const full = new PaintField(),
      half = new PaintField(),
      clear = new PaintField(),
      legacy = new PaintField();
    const paint = stroke("#002185");
    full.stamp(point(0), { ...paint, opacity: 1 });
    half.stamp(point(0), { ...paint, opacity: 0.5 });
    clear.stamp(point(0), { ...paint, opacity: 0 });
    legacy.stamp(point(0), paint);
    expect(half.cells.get("0,0")!.opacity).toBeLessThan(
      full.cells.get("0,0")!.opacity,
    );
    expect(clear.cells.size).toBe(0);
    expect([...legacy.cells]).toEqual([...full.cells]);
  });
});
