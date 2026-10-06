import { clampChroma } from "culori";
import { normalizeColor } from "./color";
import { STEPS, type ColorFamily, type ColorToken } from "./models";
import { LIGHTNESS } from "./families";
export function generatePrimitives(families: ColorFamily[]): ColorToken[] {
  const result: ColorToken[] = [];
  for (const family of families) {
    const anchors = new Map<number, ColorToken>();
    const duplicates = new Map<number, number>();
    for (const member of family.members) {
      if (member.step === undefined)
        throw new Error("Infer scale positions before generating primitives.");
      const count = duplicates.get(member.step) ?? 0;
      duplicates.set(member.step, count + 1);
      const token: ColorToken = {
        name: `${family.name}-${member.step}${count ? `-alt-${count}` : ""}`,
        family: family.name,
        step: member.step,
        color: member.color,
        source: member.positionSource ?? "inferred",
        confidence: member.confidence,
      };
      result.push(token);
      if (!anchors.has(member.step)) anchors.set(member.step, token);
    }
    const ordered = [...anchors.values()].sort((a, b) => a.step - b.step);
    if (!ordered.length) continue;
    const midpoint = ordered.reduce(
      (best, t) =>
        Math.abs(t.color.oklch.l - 0.6) < Math.abs(best.color.oklch.l - 0.6)
          ? t
          : best,
      ordered[0],
    );
    const hue = midpoint.color.oklch.h;
    const nodes = ordered.map((t) => ({
      index: STEPS.indexOf(t.step as (typeof STEPS)[number]),
      ...t.color.oklch,
      alpha: t.color.alpha,
    }));
    if (nodes[0].index > 0)
      nodes.unshift({
        index: 0,
        l: Math.max(0.99, nodes[0].l),
        c: Math.min(nodes[0].c, 0.008),
        h: hue,
        alpha: nodes[0].alpha,
      });
    const last = nodes[nodes.length - 1];
    if (last.index < STEPS.length - 1)
      nodes.push({
        index: STEPS.length - 1,
        l: Math.min(0.13, last.l),
        c: Math.min(last.c, family.name === "neutral" ? 0.015 : 0.045),
        h: hue,
        alpha: last.alpha,
      });
    if (nodes.some((node, i) => i > 0 && node.l > nodes[i - 1].l))
      family.warnings.push(
        "Extracted anchors have a non-monotonic lightness order; anchors were preserved.",
      );
    for (const [index, step] of STEPS.entries()) {
      if (anchors.has(step)) continue;
      const left = [...nodes].reverse().find((n) => n.index <= index)!;
      const right = nodes.find((n) => n.index >= index)!;
      const t =
        left.index === right.index
          ? 0
          : (index - left.index) / (right.index - left.index);
      const l = left.l + (right.l - left.l) * t;
      const h1 = left.h ?? right.h ?? hue ?? 0;
      const h2 = right.h ?? left.h ?? hue ?? 0;
      const delta = ((h2 - h1 + 540) % 360) - 180;
      // Anchor interpolation in OKLCH; reduce chroma near white and black, then gamut-map only generated values.
      const rawChroma = left.c + (right.c - left.c) * t;
      const envelope = Math.sin(Math.PI * Math.max(0, Math.min(1, l))) ** 0.65;
      const c = Math.min(
        rawChroma,
        (family.name === "neutral"
          ? 0.035
          : Math.max(midpoint.color.oklch.c, 0.08)) * envelope,
      );
      const alpha = left.alpha + (right.alpha - left.alpha) * t;
      const mapped = clampChroma(
        { mode: "oklch", l, c, h: (h1 + delta * t + 360) % 360, alpha },
        "oklch",
        "rgb",
      );
      const color = normalizeColor(
        `oklch(${mapped.l} ${mapped.c} ${mapped.h ?? 0} / ${mapped.alpha ?? 1})`,
      )!;
      result.push({
        name: `${family.name}-${step}`,
        family: family.name,
        step,
        color,
        source: "generated",
        confidence: family.confidence,
      });
    }
  }
  return result.sort(
    (a, b) =>
      a.family.localeCompare(b.family) ||
      a.step - b.step ||
      a.name.localeCompare(b.name),
  );
}
export { LIGHTNESS };
