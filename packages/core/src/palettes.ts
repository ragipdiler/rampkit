import { clampChroma } from "culori";
import { normalizeColor } from "./color";
import { LIGHTNESS } from "./families";
import {
  STEPS,
  type Anchor,
  type Palette,
  type PaletteStop,
  type GenerationSettings,
  type ColorToken,
  type Step,
  type NormalizedColor,
} from "./models";
export const DEFAULT_SETTINGS: GenerationSettings = {
  mode: "auto",
  lightness: "balanced",
  chroma: "auto",
  hue: "preserve",
};
export function paletteSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug || slug.length > 48)
    throw new Error("Use a palette name with 1–48 letters or numbers.");
  return slug;
}
function generateStops(
  constraints: PaletteStop[],
  settings: GenerationSettings,
): { stops: PaletteStop[]; warnings: string[] } {
  if (!constraints.length)
    throw new Error(
      "Keep at least one locked anchor or stop before regenerating.",
    );
  if (new Set(constraints.map((a) => a.step)).size !== constraints.length)
    throw new Error("Each anchor must use a different scale position.");
  const nodes = constraints
    .map((a) => ({ index: STEPS.indexOf(a.step as Step), color: a.color }))
    .sort((a, b) => a.index - b.index);
  if (nodes.some((n) => n.index < 0))
    throw new Error("Choose a supported scale position.");
  const warnings = nodes.some(
    (n, i) => i > 0 && n.color.oklch.l >= nodes[i - 1].color.oklch.l,
  )
    ? [
        "Anchor lightness is not descending. Anchors remain unchanged; consider adjusting their positions.",
      ]
    : [];
  const reference = [...nodes].sort(
    (a, b) => b.color.oklch.c - a.color.oklch.c,
  )[0].color;
  const lightCurve =
    settings.lightness === "soft"
      ? LIGHTNESS.map((l) => Math.sqrt(l))
      : LIGHTNESS;
  const endpoints = [...nodes];
  const first = nodes[0],
    last = nodes.at(-1)!;
  // Shape extrapolation by the standard lightness curve; exact constraints remain untouched.
  const virtual = (l: number, side: "light" | "dark") =>
    normalizeColor(
      `oklch(${l} ${Math.min(reference.oklch.c, side === "light" ? 0.008 : 0.04)} ${reference.oklch.h ?? 0} / ${side === "light" ? first.color.alpha : last.color.alpha})`,
    )!;
  if (first.index > 0)
    endpoints.unshift({
      index: 0,
      color: virtual(Math.max(0.99, first.color.oklch.l), "light"),
    });
  if (last.index < 11)
    endpoints.push({
      index: 11,
      color: virtual(Math.min(0.13, last.color.oklch.l), "dark"),
    });
  const stops = STEPS.map((step, index): PaletteStop => {
    const fixed = constraints.find((s) => s.step === step);
    if (fixed) return { ...fixed };
    const left = [...endpoints].reverse().find((n) => n.index <= index)!;
    const right = endpoints.find((n) => n.index >= index)!;
    const denominator = lightCurve[left.index] - lightCurve[right.index];
    const t =
      left.index === right.index
        ? 0
        : (lightCurve[left.index] - lightCurve[index]) / denominator;
    const a = left.color.oklch,
      b = right.color.oklch;
    const l = a.l + (b.l - a.l) * t;
    const h1 = a.h ?? reference.oklch.h ?? 0,
      h2 = b.h ?? h1;
    const delta = ((h2 - h1 + 540) % 360) - 180;
    const h =
      settings.hue === "blend"
        ? (h1 + delta * t + 360) % 360
        : (reference.oklch.h ?? 0);
    const envelope = Math.sin(Math.PI * Math.max(0, Math.min(1, l))) ** 0.7;
    const c =
      Math.max(
        0,
        Math.min(
          a.c + (b.c - a.c) * t,
          Math.max(reference.oklch.c, 0.02) * envelope,
        ),
      ) * (settings.chroma === "muted" ? 0.75 : 1);
    const alpha = left.color.alpha + (right.color.alpha - left.color.alpha) * t;
    const mapped = clampChroma(
      { mode: "oklch", l, c, h, alpha },
      "oklch",
      "rgb",
    );
    const color = normalizeColor(
      `oklch(${mapped.l} ${mapped.c} ${mapped.h ?? 0} / ${alpha})`,
    )!;
    return { step, color, source: "generated", locked: false };
  });
  return { stops, warnings };
}
export function createPalette(
  name: string,
  anchors: Anchor[],
  id = paletteSlug(name),
  settings = DEFAULT_SETTINGS,
): Palette {
  paletteSlug(name);
  if (!anchors.length) throw new Error("Add at least one anchor.");
  const locked = anchors.map((a) => ({ ...a, locked: true }));
  const generated = generateStops(
    locked.map((a) => ({
      step: a.step,
      color: a.color,
      source: "anchor",
      locked: true,
      anchorOrigin: a.origin,
    })),
    settings,
  );
  return {
    id,
    name: name.trim(),
    anchors: locked,
    settings: { ...settings },
    ...generated,
  };
}
/** Custom collections keep their exact colors and order; they are not generated scales. */
export function createCustomPalette(
  name: string,
  colors: NormalizedColor[],
  id = paletteSlug(name),
): Palette {
  paletteSlug(name);
  if (!colors.length || colors.length > 256)
    throw new Error("Add between 1 and 256 colors.");
  return {
    id,
    name: name.trim(),
    kind: "custom",
    anchors: [],
    settings: { ...DEFAULT_SETTINGS },
    warnings: [],
    stops: colors.map((color, index) => ({
      step: index + 1,
      color,
      source: "anchor",
      locked: true,
      anchorOrigin: "manual",
    })),
  };
}
export function regeneratePalette(palette: Palette): Palette {
  if (palette.kind === "custom") return palette;
  const constraints = palette.stops.filter((s) => s.locked);
  const generated = generateStops(constraints, palette.settings);
  return {
    ...palette,
    anchors: palette.anchors.filter((a) =>
      constraints.some((s) => s.step === a.step),
    ),
    ...generated,
  };
}
export function editPaletteStop(
  palette: Palette,
  step: number,
  value: string,
  origin: "manual" | "extracted" = "manual",
  sourceColorId?: string,
): Palette {
  const color = normalizeColor(value);
  if (!color) throw new Error("Enter a usable HEX, RGB, or OKLCH color.");
  if (palette.kind === "custom") {
    if (!palette.stops.some((s) => s.step === step))
      throw new Error("Choose an existing color.");
    return {
      ...palette,
      stops: palette.stops.map((s) =>
        s.step === step ? { ...s, color, anchorOrigin: origin } : s,
      ),
    };
  }
  if (!STEPS.includes(step as (typeof STEPS)[number]))
    throw new Error("Choose a supported scale position.");
  const anchor: Anchor = {
    step: step as Anchor["step"],
    color,
    locked: true,
    origin,
    sourceColorId,
  };
  return {
    ...palette,
    anchors: [...palette.anchors.filter((a) => a.step !== step), anchor].sort(
      (a, b) => a.step - b.step,
    ),
    stops: palette.stops.map((s) =>
      s.step === step
        ? { ...s, color, source: "anchor", locked: true, anchorOrigin: origin }
        : s,
    ),
  };
}
export function toggleStopLock(palette: Palette, step: number): Palette {
  if (palette.kind === "custom") return palette;
  return {
    ...palette,
    anchors: palette.anchors.map((a) =>
      a.step === step ? { ...a, locked: !a.locked } : a,
    ),
    stops: palette.stops.map((s) =>
      s.step === step ? { ...s, locked: !s.locked } : s,
    ),
  };
}
export function palettesToPrimitives(palettes: Palette[]): ColorToken[] {
  const slugs = palettes.map((p) => paletteSlug(p.name));
  if (new Set(slugs).size !== slugs.length)
    throw new Error("Palette names must produce unique token prefixes.");
  return palettes.flatMap((p) =>
    p.stops.map((s) => ({
      name: `${paletteSlug(p.name)}-${s.step}`,
      family: paletteSlug(p.name),
      step: s.step,
      color: s.color,
      source:
        s.source === "generated"
          ? ("generated" as const)
          : s.anchorOrigin === "manual"
            ? ("manual" as const)
            : ("extracted" as const),
      confidence: 1,
      locked: s.locked,
    })),
  );
}
