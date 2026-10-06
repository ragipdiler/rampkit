import { contrastRatio, contrastChecks } from "../../core/src/contrast";
import { colorDistance } from "../../core/src/color";
import type {
  ColorToken,
  ContrastResult,
  SemanticToken,
  Theme,
} from "../../core/src/models";
export const SEMANTIC_NAMES = [
  "background-primary",
  "background-secondary",
  "background-tertiary",
  "surface-primary",
  "surface-secondary",
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "text-inverse",
  "border-primary",
  "border-secondary",
  "border-focus",
  "action-primary",
  "action-primary-hover",
  "action-primary-active",
  "action-primary-foreground",
  "action-secondary",
  "action-secondary-hover",
  "action-secondary-active",
  "action-secondary-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "danger",
  "danger-foreground",
  "info",
  "info-foreground",
];
export function generateSemantics(primitives: ColorToken[]): SemanticToken[] {
  const families = [...new Set(primitives.map((t) => t.family))];
  const chromatic = families.filter((f) =>
    primitives.some(
      (t) =>
        t.family === f && t.source !== "generated" && t.color.oklch.c >= 0.035,
    ),
  );
  const brand =
    ["brand", "primary", "accent"].find((f) => chromatic.includes(f)) ??
    [...chromatic].sort((a, b) => {
      const score = (f: string) =>
        primitives
          .filter((t) => t.family === f && t.source !== "generated")
          .reduce((sum, t) => sum + t.color.usageCount, 0);
      return score(b) - score(a) || a.localeCompare(b);
    })[0];
  const pick = (family: string | undefined, step: number) =>
    family
      ? primitives.find(
          (t) =>
            t.family === family && t.step === step && !t.name.includes("-alt-"),
        )
      : undefined;
  const result: SemanticToken[] = [];
  for (const theme of ["light", "dark"] as const) {
    const dark = theme === "dark";
    const map = new Map<string, ColorToken | undefined>();
    const neutral = (step: number) => pick("neutral", step);
    map.set("background-primary", neutral(dark ? 950 : 25));
    map.set("background-secondary", neutral(dark ? 900 : 50));
    map.set("background-tertiary", neutral(dark ? 800 : 100));
    map.set("surface-primary", neutral(dark ? 900 : 50));
    map.set("surface-secondary", neutral(dark ? 800 : 100));
    map.set("text-primary", neutral(dark ? 25 : 950));
    map.set("text-secondary", neutral(dark ? 200 : 700));
    map.set("text-tertiary", neutral(dark ? 400 : 600));
    map.set("text-inverse", neutral(dark ? 950 : 25));
    map.set("border-primary", neutral(dark ? 600 : 400));
    map.set("border-secondary", neutral(dark ? 700 : 300));
    map.set("border-focus", pick(brand, dark ? 400 : 600));
    map.set("action-primary", pick(brand, dark ? 400 : 600));
    map.set("action-primary-hover", pick(brand, dark ? 300 : 700));
    map.set("action-primary-active", pick(brand, dark ? 200 : 800));
    map.set("action-secondary", neutral(dark ? 800 : 100));
    map.set("action-secondary-hover", neutral(dark ? 700 : 200));
    map.set("action-secondary-active", neutral(dark ? 600 : 300));
    map.set("action-secondary-foreground", neutral(dark ? 25 : 950));
    const foreground = (background: ColorToken | undefined) => {
      if (!background) return undefined;
      return primitives
        .filter((t) => t.family === "neutral" && t.color.alpha === 1)
        .sort(
          (a, b) =>
            contrastRatio(b.color, background.color, dark ? "#000" : "#fff") -
              contrastRatio(
                a.color,
                background.color,
                dark ? "#000" : "#fff",
              ) || a.name.localeCompare(b.name),
        )[0];
    };
    map.set("action-primary-foreground", foreground(map.get("action-primary")));
    for (const [name, candidates] of [
      ["success", ["green", "teal"]],
      ["warning", ["amber", "orange"]],
      ["danger", ["red", "pink"]],
      ["info", ["blue", "cyan"]],
    ] as const) {
      const family = candidates.find((f) => families.includes(f));
      const background = pick(family, dark ? 400 : 600);
      map.set(name, background);
      map.set(`${name}-foreground`, foreground(background));
    }
    for (const name of SEMANTIC_NAMES) {
      const token = map.get(name);
      result.push({
        name,
        theme,
        primitiveToken: token?.name ?? null,
        ...(!token
          ? { reason: "No suitable source family was detected." }
          : {}),
      });
    }
  }
  return result;
}
export function suggestContrast(
  foreground: ColorToken,
  background: ColorToken,
  primitives: ColorToken[],
  threshold: number,
  theme: Theme,
): { token: string; ratio: number } | undefined {
  const candidates = primitives
    .filter((t) => t.name !== foreground.name)
    .map((token) => ({
      token,
      ratio: contrastRatio(
        token.color,
        background.color,
        theme === "dark" ? "#000" : "#fff",
      ),
      distance: colorDistance(token.color, foreground.color),
    }))
    .filter((t) => t.ratio >= threshold);
  // Prefer another stop in the same family; then the closest perceptual color.
  candidates.sort(
    (a, b) =>
      Number(b.token.family === foreground.family) -
        Number(a.token.family === foreground.family) ||
      a.distance - b.distance ||
      a.token.name.localeCompare(b.token.name),
  );
  return candidates[0]
    ? { token: candidates[0].token.name, ratio: candidates[0].ratio }
    : undefined;
}
export function validateSemantics(
  semantics: SemanticToken[],
  primitives: ColorToken[],
): ContrastResult[] {
  const result: ContrastResult[] = [];
  const byName = new Map(primitives.map((t) => [t.name, t]));
  for (const theme of ["light", "dark"] as const) {
    const mapping = new Map(
      semantics
        .filter((t) => t.theme === theme)
        .map((t) => [t.name, t.primitiveToken]),
    );
    const pairs: [string, string, "text" | "ui"][] = [];
    for (const bg of [
      "background-primary",
      "background-secondary",
      "background-tertiary",
      "surface-primary",
      "surface-secondary",
    ])
      for (const fg of ["text-primary", "text-secondary", "text-tertiary"])
        pairs.push([fg, bg, "text"]);
    for (const fg of [
      "border-primary",
      "border-secondary",
      "border-focus",
      "action-primary",
    ])
      pairs.push([fg, "background-primary", "ui"]);
    for (const bg of [
      "action-primary",
      "action-primary-hover",
      "action-primary-active",
    ])
      pairs.push(["action-primary-foreground", bg, "text"]);
    for (const bg of [
      "action-secondary",
      "action-secondary-hover",
      "action-secondary-active",
    ])
      pairs.push(["action-secondary-foreground", bg, "text"]);
    for (const bg of ["success", "warning", "danger", "info"])
      pairs.push([`${bg}-foreground`, bg, "text"]);
    for (const [foreground, background, criterion] of pairs) {
      const fgName = mapping.get(foreground),
        bgName = mapping.get(background);
      if (!fgName || !bgName) continue;
      const fg = byName.get(fgName),
        bg = byName.get(bgName);
      if (!fg || !bg) continue;
      const ratio = contrastRatio(
        fg.color,
        bg.color,
        theme === "dark" ? "#000" : "#fff",
      );
      const checks = contrastChecks(ratio);
      const pass = criterion === "ui" ? checks.ui : checks.aaNormal;
      const suggestion = pass
        ? undefined
        : suggestContrast(
            fg,
            bg,
            primitives,
            criterion === "ui" ? 3 : 4.5,
            theme,
          );
      result.push({
        theme,
        foreground,
        background,
        foregroundToken: fgName,
        backgroundToken: bgName,
        ratio,
        checks,
        criterion,
        pass,
        ...(suggestion ? { suggestion } : {}),
      });
    }
  }
  return result;
}
