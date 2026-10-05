import {
  converter,
  parse,
  formatHex,
  formatHex8,
  formatRgb,
  inGamut,
} from "culori";
import type { ColorOccurrence, NormalizedColor } from "./models";
const toRgb = converter("rgb");
const toOklch = converter("oklch");
const round = (n: number) => Number(n.toFixed(7));
export function normalizeColor(
  value: string,
  sources: ColorOccurrence[] = [],
): NormalizedColor | null {
  // Culori also accepts bare hexadecimal words; manual CSS colors require #.
  if (/^[0-9a-f]{3,8}$/i.test(value.trim())) return null;
  const parsed = parse(value.trim());
  if (!parsed) return null;
  const rgb = toRgb(parsed);
  const oklch = toOklch(parsed);
  if (!rgb || !oklch) return null;
  const alpha = Math.max(0, Math.min(1, parsed.alpha ?? 1));
  if (
    alpha === 0 ||
    ![rgb.r, rgb.g, rgb.b, oklch.l, oklch.c].every(Number.isFinite)
  )
    return null;
  const h = oklch.c < 1e-7 ? null : (oklch.h ?? null);
  // Keep full precision for calculations/export; HEX and RGB are display fallbacks.
  const css = `oklch(${oklch.l} ${oklch.c} ${h ?? 0}${alpha < 1 ? ` / ${alpha}` : ""})`;
  const id = [round(rgb.r), round(rgb.g), round(rgb.b), round(alpha)].join(":");
  return {
    id,
    hex: (alpha < 1 ? formatHex8(parsed) : formatHex(parsed))!,
    rgb: formatRgb(parsed)!,
    oklch: { l: oklch.l, c: oklch.c, h },
    alpha,
    css,
    srgb: { r: rgb.r, g: rgb.g, b: rgb.b },
    inSrgbGamut: inGamut("rgb")(parsed),
    usageCount: sources
      .filter((s) => s.kind === "rendered")
      .reduce((n, s) => n + s.count, 0),
    sources,
  };
}
export function displayOklch(color: NormalizedColor): string {
  const { l, c, h } = color.oklch;
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h === null ? "0" : h.toFixed(2)}${color.alpha < 1 ? ` / ${color.alpha}` : ""})`;
}
export function normalizeOccurrences(
  occurrences: ColorOccurrence[],
): NormalizedColor[] {
  const colors = new Map<string, NormalizedColor>();
  for (const occurrence of occurrences) {
    const color = normalizeColor(occurrence.originalValue, [occurrence]);
    if (!color) continue;
    const existing = colors.get(color.id);
    if (existing) {
      existing.sources.push(occurrence);
      existing.usageCount += color.usageCount;
    } else colors.set(color.id, color);
  }
  return [...colors.values()].sort(
    (a, b) => b.usageCount - a.usageCount || a.id.localeCompare(b.id),
  );
}
export function colorDistance(a: NormalizedColor, b: NormalizedColor): number {
  const lab = converter("oklab");
  const x = lab(a.css)!;
  const y = lab(b.css)!;
  return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);
}
