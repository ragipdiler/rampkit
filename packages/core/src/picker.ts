import { converter, formatHex } from "culori";
export type PickerHsv = { h: number; s: number; v: number };
export function pickerHsv(hex: string): PickerHsv {
  const value = converter("hsv")(hex)!;
  return { h: value.h ?? 0, s: value.s, v: value.v };
}
export function pickerHex(hsv: PickerHsv): string {
  return formatHex({ mode: "hsv", ...hsv })!;
}
export function pickerRgb(hex: string): number[] {
  const rgb = converter("rgb")(hex)!;
  return [rgb.r, rgb.g, rgb.b].map((c) => Math.round(c * 255));
}
export function pickerRgbHex(rgb: number[]): string {
  return formatHex({
    mode: "rgb",
    r: rgb[0] / 255,
    g: rgb[1] / 255,
    b: rgb[2] / 255,
  })!;
}
export function pickerCss(hex: string, opacity: number): string {
  return opacity >= 1
    ? hex
    : `${hex}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
}
