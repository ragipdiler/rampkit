import { describe, expect, it } from "vitest";
import { suggestPaletteName } from "./naming";
import { normalizeColor } from "./color";

describe("color-based palette names", () => {
  it("uses the same family for equivalent HEX, RGB and OKLCH colors", () => {
    const blue = normalizeColor("#2679f3")!;
    for (const value of [blue.hex, blue.rgb, blue.css])
      expect(suggestPaletteName(value)).toBe("Blue");
    expect(suggestPaletteName("#ef5b35")).toBe("Orange");
    expect(suggestPaletteName("#22aa66")).toBe("Green");
  });
  it("names achromatic and near-neutral anchors consistently", () => {
    for (const value of ["#fff", "#000", "rgb(38, 38, 38)", "#131316"])
      expect(suggestPaletteName(value)).toBe("Neutral");
  });
  it("avoids collisions in token prefixes without mutating the names", () => {
    const names = ["BLUE", "blue-2", "Blue 3"];
    expect(suggestPaletteName("#2679f3", names)).toBe("Blue 4");
    expect(names).toEqual(["BLUE", "blue-2", "Blue 3"]);
  });
  it("does not invent names for incomplete, invalid or transparent values", () => {
    for (const value of ["", "#", "#zzzzzz", "no color", "transparent"])
      expect(suggestPaletteName(value)).toBeNull();
  });
});
