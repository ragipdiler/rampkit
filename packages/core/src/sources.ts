import { normalizeColor, colorDistance } from "./color";
import type { NormalizedColor, SourceColor } from "./models";
function opaque(color: NormalizedColor): NormalizedColor {
  if (color.alpha === 1) return color;
  const { l, c, h } = color.oklch;
  return normalizeColor(`oklch(${l} ${c} ${h ?? 0})`)!;
}
function score(color: NormalizedColor): { value: number; reasons: string[] } {
  const rendered = color.sources.filter((s) => s.kind === "rendered");
  const meaningful = rendered.filter(
    (s) =>
      !s.cssProperty.includes("shadow") && !s.cssProperty.includes("pseudo"),
  );
  const variable = color.sources.some((s) => s.cssVariableName);
  const semantic = color.sources.some((s) =>
    /primary|brand|accent|neutral|background|foreground|text|success|danger|warning/i.test(
      s.cssVariableName ?? "",
    ),
  );
  const surface = meaningful.some((s) =>
    ["color", "background-color", "fill"].includes(s.cssProperty),
  );
  const reasons: string[] = [];
  let value =
    Math.log2(1 + color.usageCount) * 7 +
    (color.alpha === 1 ? 22 : 0) +
    (variable ? 18 : 0) +
    (semantic ? 12 : 0) +
    (surface ? 20 : 0) +
    Math.min(10, color.oklch.c * 40);
  if (!meaningful.length) {
    value -= 30;
    reasons.push("Shadow or pseudo-element evidence only");
  }
  if (color.alpha < 1) {
    value -= 15;
    reasons.push("Alpha variants grouped under an opaque base");
  }
  if (!variable && color.usageCount <= 1 && color.oklch.c < 0.005 && !surface) {
    value -= 15;
    reasons.push("Low-value implementation/default color");
  }
  if (variable) reasons.push("CSS variable evidence");
  if (surface) reasons.push("Foreground or surface use");
  return { value: Math.max(0, Math.min(100, value)), reasons };
}
export function curateSourceColors(colors: NormalizedColor[]): SourceColor[] {
  // Opaque evidence wins representation. Original variants are never mutated or discarded.
  const ranked = [...colors].sort(
    (a, b) =>
      Number(b.alpha === 1) - Number(a.alpha === 1) ||
      score(b).value - score(a).value ||
      a.id.localeCompare(b.id),
  );
  const sources: SourceColor[] = [];
  for (const color of ranked) {
    const base = opaque(color);
    const exact = sources.find((s) => s.color.id === base.id);
    const similar =
      exact ?? sources.find((s) => colorDistance(s.color, base) < 0.006);
    if (similar) {
      similar.variants.push(color);
      similar.usefulness = Math.max(similar.usefulness, score(color).value);
      similar.curated = similar.usefulness >= 40;
      if (
        color.alpha < 1 &&
        !similar.reasons.includes("Alpha variants grouped under an opaque base")
      )
        similar.reasons.push("Alpha variants grouped under an opaque base");
      continue;
    }
    const scored = score(color);
    sources.push({
      id: base.id,
      color: base,
      variants: [color],
      origin: "extracted",
      usefulness: scored.value,
      curated: scored.value >= 40,
      reasons: scored.reasons,
    });
  }
  return sources.sort(
    (a, b) => b.usefulness - a.usefulness || a.id.localeCompare(b.id),
  );
}
export function manualSource(value: string): SourceColor {
  const color = normalizeColor(value);
  if (!color) throw new Error("Enter a usable HEX, RGB, or OKLCH color.");
  return {
    id: `manual:${color.id}`,
    color,
    variants: [color],
    origin: "manual",
    usefulness: 100,
    curated: true,
    reasons: ["Manually added"],
  };
}
