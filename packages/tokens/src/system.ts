import type {
  Palette,
  SemanticToken,
  AnalysisReport,
  Theme,
} from "../../core/src/models";
import { palettesToPrimitives } from "../../core/src/palettes";
import { SEMANTIC_NAMES, validateSemantics } from "./semantic";
export type TokenSystem = Pick<
  AnalysisReport,
  "primitives" | "semantics" | "contrast"
> & { palettes?: Palette[] };
export function blankSemantics(): SemanticToken[] {
  return (["light", "dark"] as Theme[]).flatMap((theme) =>
    SEMANTIC_NAMES.map((name) => ({
      name,
      theme,
      primitiveToken: null,
      reason: "Not mapped.",
    })),
  );
}
export function buildTokenSystem(
  palettes: Palette[],
  mappings: SemanticToken[] = blankSemantics(),
): TokenSystem {
  const primitives = palettesToPrimitives(palettes);
  const names = new Set(primitives.map((t) => t.name));
  // Newly introduced roles remain unresolved for existing mapping sets.
  const completeMappings = mappings.length
    ? [
        ...mappings,
        ...blankSemantics().filter(
          (role) =>
            !mappings.some(
              (saved) => saved.theme === role.theme && saved.name === role.name,
            ),
        ),
      ]
    : mappings;
  const semantics = completeMappings.map((t) =>
    t.primitiveToken && !names.has(t.primitiveToken)
      ? {
          ...t,
          primitiveToken: null,
          reason: "Referenced palette token is no longer available.",
        }
      : t,
  );
  return {
    palettes,
    primitives,
    semantics,
    contrast: validateSemantics(semantics, primitives),
  };
}
