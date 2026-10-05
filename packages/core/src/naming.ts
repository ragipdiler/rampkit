import { normalizeColor } from "./color";
import { detectFamilies } from "./families";
import { paletteSlug } from "./palettes";

/** Suggest a family name from the actual color, never from website metadata. */
export function suggestPaletteName(
  value: string,
  existingNames: readonly string[] = [],
): string | null {
  const color = normalizeColor(value);
  if (!color) return null;
  const family = detectFamilies([color])[0].name;
  const base = family[0].toUpperCase() + family.slice(1);
  const used = new Set(existingNames.map(paletteSlug));
  let name = base;
  for (let suffix = 2; used.has(paletteSlug(name)); suffix++)
    name = `${base} ${suffix}`;
  return name;
}
