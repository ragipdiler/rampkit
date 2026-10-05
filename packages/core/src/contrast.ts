import { normalizeColor } from "./color";
import type { ContrastChecks, NormalizedColor } from "./models";
type Channels = { r: number; g: number; b: number };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
function composite(color: NormalizedColor, back: Channels): Channels {
  const a = color.alpha;
  return {
    r: clamp(color.srgb.r) * a + back.r * (1 - a),
    g: clamp(color.srgb.g) * a + back.g * (1 - a),
    b: clamp(color.srgb.b) * a + back.b * (1 - a),
  };
}
export function luminance(rgb: Channels): number {
  const linear = (n: number) => {
    n = clamp(n);
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * linear(rgb.r) + 0.7152 * linear(rgb.g) + 0.0722 * linear(rgb.b)
  );
}
export function contrastRatio(
  foreground: NormalizedColor | string,
  background: NormalizedColor | string,
  canvas: NormalizedColor | string = "#fff",
): number {
  const resolve = (c: NormalizedColor | string) => {
    const result = typeof c === "string" ? normalizeColor(c) : c;
    if (!result) throw new Error("Contrast requires a usable color.");
    return result;
  };
  const fg = resolve(foreground),
    bg = resolve(background),
    base = resolve(canvas);
  if (base.alpha !== 1) throw new Error("Contrast canvas must be opaque.");
  const backgroundRgb = composite(bg, base.srgb);
  const foregroundRgb = composite(fg, backgroundRgb);
  const a = luminance(foregroundRgb),
    b = luminance(backgroundRgb);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function contrastChecks(ratio: number): ContrastChecks {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    ui: ratio >= 3,
  };
}
