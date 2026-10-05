import {
  STEPS,
  type ColorFamily,
  type NormalizedColor,
  type Step,
} from "./models";
export const LIGHTNESS = [
  0.99, 0.975, 0.95, 0.9, 0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.23, 0.15,
];
const alias: Record<string, string> = {
  gray: "neutral",
  grey: "neutral",
  slate: "neutral",
  zinc: "neutral",
  stone: "neutral",
  neutral: "neutral",
  blue: "blue",
  cyan: "cyan",
  teal: "teal",
  purple: "purple",
  violet: "purple",
  green: "green",
  emerald: "green",
  lime: "green",
  red: "red",
  rose: "red",
  amber: "amber",
  orange: "orange",
  yellow: "amber",
  pink: "pink",
  primary: "primary",
  accent: "accent",
  brand: "brand",
};
function namedEvidence(
  color: NormalizedColor,
): { name: string; confidence: number } | null {
  const names = [
    ...new Set(
      color.sources.flatMap((s) =>
        s.cssVariableName ? [s.cssVariableName] : [],
      ),
    ),
  ].sort();
  for (const variable of names) {
    const parts = variable.toLowerCase().replace(/^--/, "").split(/[-_]/);
    for (const part of parts)
      if (alias[part]) return { name: alias[part], confidence: 0.94 };
  }
  return null;
}
function hueFamily(h: number): string {
  if (h < 35 || h >= 350) return "red";
  if (h < 75) return "orange";
  if (h < 110) return "amber";
  if (h < 165) return "green";
  if (h < 200) return "teal";
  if (h < 240) return "cyan";
  if (h < 285) return "blue";
  if (h < 325) return "purple";
  return "pink";
}
export function detectFamilies(colors: NormalizedColor[]): ColorFamily[] {
  const map = new Map<string, ColorFamily>();
  for (const color of colors) {
    const evidence = namedEvidence(color);
    const name =
      evidence?.name ??
      (color.oklch.c < 0.035 ? "neutral" : hueFamily(color.oklch.h ?? 0));
    const confidence =
      evidence?.confidence ?? (color.oklch.c < 0.02 ? 0.88 : 0.72);
    let family = map.get(name);
    if (!family) {
      family = { name, confidence, members: [], warnings: [] };
      map.set(name, family);
    }
    family.members.push({ color, confidence });
  }
  for (const family of map.values())
    family.confidence =
      family.members.reduce((n, m) => n + m.confidence, 0) /
      family.members.length;
  return [...map.values()].sort((a, b) =>
    a.name === "neutral"
      ? -1
      : b.name === "neutral"
        ? 1
        : a.name.localeCompare(b.name),
  );
}
export function inferPositions(families: ColorFamily[]): ColorFamily[] {
  return families.map((family) => {
    const warnings = [...family.warnings];
    const occupied = new Set<Step>();
    const members = family.members.map((member) => {
      const named = [
        ...new Set(
          member.color.sources.flatMap((s) =>
            s.cssVariableName ? [s.cssVariableName] : [],
          ),
        ),
      ]
        .sort()
        .flatMap((name) => {
          const match = name.match(
            /(?:-|_)(25|50|100|200|300|400|500|600|700|800|900|950)$/,
          );
          return match ? [Number(match[1]) as Step] : [];
        });
      if (named.length) {
        const step = named[0];
        if (occupied.has(step))
          warnings.push(
            `Multiple extracted colors claim ${family.name}-${step}; all are preserved as separate tokens.`,
          );
        occupied.add(step);
        return { ...member, step, positionSource: "extracted" as const };
      }
      return { ...member };
    });
    // Fit unnamed positions to the named anchors' lightness profile. Keep
    // collisions as alternatives instead of forcing a white/shadow into a
    // distant free slot that would reverse the ramp's lightness progression.
    const nodes = members
      .filter((m) => m.step !== undefined)
      .map((m) => ({ index: STEPS.indexOf(m.step!), l: m.color.oklch.l }))
      .sort((a, b) => a.index - b.index);
    const profile = LIGHTNESS.map((target, index) => {
      if (!nodes.length) return target;
      const left = [...nodes].reverse().find((n) => n.index <= index);
      const right = nodes.find((n) => n.index >= index);
      if (left && right) {
        if (left.index === right.index) return left.l;
        return (
          left.l +
          ((right.l - left.l) * (index - left.index)) /
            (right.index - left.index)
        );
      }
      if (right)
        return Math.min(
          1,
          right.l +
            ((1 - right.l) * (right.index - index)) / Math.max(1, right.index),
        );
      return Math.max(
        0,
        left!.l +
          ((0.13 - left!.l) * (index - left!.index)) /
            Math.max(1, STEPS.length - 1 - left!.index),
      );
    });
    for (const member of members.filter((m) => m.step === undefined)) {
      const ranked = STEPS.map((step, index) => ({
        step,
        distance: Math.abs(profile[index] - member.color.oklch.l),
      })).sort((a, b) => a.distance - b.distance || a.step - b.step);
      member.step = ranked[0].step;
      member.positionSource = "inferred";
      if (occupied.has(member.step))
        warnings.push(
          "Inferred colors sharing a scale position are preserved as alternative tokens.",
        );
      occupied.add(member.step);
    }
    return {
      ...family,
      members: members.sort(
        (a, b) =>
          a.step! - b.step! ||
          Number(b.positionSource === "extracted") -
            Number(a.positionSource === "extracted") ||
          Number(b.color.alpha === 1) - Number(a.color.alpha === 1) ||
          b.color.usageCount - a.color.usageCount ||
          a.color.id.localeCompare(b.color.id),
      ),
      warnings: [...new Set(warnings)],
    };
  });
}
