import { describe, it, expect } from "vitest";
import { normalizeColor } from "./color";
import { detectFamilies, inferPositions } from "./families";
import { generatePrimitives } from "./scales";
function color(value: string, variable?: string) {
  return normalizeColor(
    value,
    variable
      ? [
          {
            originalValue: value,
            cssVariableName: variable,
            cssProperty: "color",
            elementTypes: ["p"],
            count: 1,
            kind: "rendered",
          },
        ]
      : [],
  )!;
}
function build(colors: ReturnType<typeof color>[]) {
  return generatePrimitives(inferPositions(detectFamilies(colors)));
}
describe("families, positions and ramps", () => {
  it("uses variable evidence and labels inference", () => {
    const families = inferPositions(
      detectFamilies([
        color("#fff", "--gray-25"),
        color("#333", "--gray-900"),
        color("#777"),
      ]),
    );
    expect(families[0].name).toBe("neutral");
    expect(families[0].members.find((m) => m.step === 25)!.positionSource).toBe(
      "extracted",
    );
    expect(
      families[0].members.find((m) => m.color.hex === "#777777")!
        .positionSource,
    ).toBe("inferred");
  });
  it("keeps every extracted anchor and produces twelve stops", () => {
    const anchors = [
      color("#fcfcfd", "--neutral-25"),
      color("#f9f9fb", "--neutral-50"),
      color("#18181b", "--neutral-900"),
    ];
    const tokens = build(anchors);
    expect(tokens).toHaveLength(12);
    for (const anchor of anchors)
      expect(tokens.find((t) => t.color.id === anchor.id)!.color).toBe(anchor);
    expect(tokens.filter((t) => t.source === "generated")).toHaveLength(9);
  });
  it("retains neutral tint and descending lightness", () => {
    const tokens = build([
      color("oklch(.95 .008 285)", "--neutral-50"),
      color("oklch(.22 .012 285)", "--neutral-900"),
    ]);
    expect(tokens.every((t) => t.color.oklch.c < 0.036)).toBe(true);
    expect(tokens.find((t) => t.step === 500)!.color.oklch.h).toBeCloseTo(
      285,
      2,
    );
    for (let i = 1; i < tokens.length; i++)
      expect(tokens[i].color.oklch.l).toBeLessThan(tokens[i - 1].color.oklch.l);
  });
  it("generates chromatic values deterministically in gamut", () => {
    const source = [color("#6c47ff", "--purple-500")];
    const a = build(source),
      b = build(source);
    expect(a).toEqual(b);
    expect(
      a
        .filter((t) => t.source === "generated")
        .every((t) => t.color.inSrgbGamut),
    ).toBe(true);
    expect(a.find((t) => t.step === 500)!.color.hex).toBe("#6c47ff");
  });
  it("preserves colliding extracted anchors as alternatives", () => {
    const tokens = build([
      color("#777", "--neutral-500"),
      color("#888", "--gray-500"),
    ]);
    expect(tokens).toHaveLength(13);
    expect(tokens.some((t) => t.name === "neutral-500-alt-1")).toBe(true);
  });
});
it("does not force unnamed whites or translucent shadows into conflicting named ramps", () => {
  const tokens = build([
    color("#fcfcfd", "--neutral-25"),
    color("#f9f9fb", "--neutral-50"),
    color("#18181b", "--neutral-900"),
    color("#fff"),
    color("rgb(20 30 40 / .5)"),
  ]);
  expect(tokens.find((t) => t.name === "neutral-25")!.color.hex).toBe(
    "#fcfcfd",
  );
  expect(tokens.find((t) => t.name === "neutral-25-alt-1")!.color.hex).toBe(
    "#ffffff",
  );
  const canonical = tokens.filter((t) => !t.name.includes("-alt-"));
  for (let i = 1; i < canonical.length; i++)
    expect(canonical[i].color.oklch.l).toBeLessThan(
      canonical[i - 1].color.oklch.l,
    );
  expect(canonical.every((t) => t.color.alpha === 1)).toBe(true);
  expect(
    tokens.some((t) => t.color.alpha === 0.5 && t.name.includes("-alt-")),
  ).toBe(true);
});
