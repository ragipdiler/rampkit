import { expect, it } from "vitest";
import {
  pickerHsv,
  pickerHex,
  pickerRgb,
  pickerRgbHex,
  pickerCss,
} from "./picker";
it("picker modes share consistent, normalized color values", () => {
  expect(pickerHex({ h: 120, s: 1, v: 1 })).toBe("#00ff00");
  expect(pickerHex({ h: 360, s: 1, v: 1 })).toBe("#ff0000");
  expect(pickerRgb("#2679f3")).toEqual([38, 121, 243]);
  expect(pickerRgbHex([38, 121, 243])).toBe("#2679f3");
  expect(pickerHex(pickerHsv("#2679f3"))).toBe("#2679f3");
  expect(pickerCss("#2679f3", 0.5)).toBe("#2679f380");
});
