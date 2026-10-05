export const STEPS = [
  25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
export type Step = (typeof STEPS)[number];
export type ColorSource = "extracted" | "inferred" | "generated" | "manual";
export type Theme = "light" | "dark";
export interface ColorOccurrence {
  originalValue: string;
  cssProperty: string;
  cssVariableName?: string;
  elementTypes: string[];
  count: number;
  kind: "rendered" | "variable";
}
export interface NormalizedColor {
  id: string;
  hex: string;
  rgb: string;
  oklch: { l: number; c: number; h: number | null };
  alpha: number;
  css: string;
  srgb: { r: number; g: number; b: number };
  inSrgbGamut: boolean;
  usageCount: number;
  sources: ColorOccurrence[];
}
export interface FamilyMember {
  color: NormalizedColor;
  confidence: number;
  step?: Step;
  positionSource?: "extracted" | "inferred";
}
export interface ColorFamily {
  name: string;
  confidence: number;
  members: FamilyMember[];
  warnings: string[];
}
export interface ColorToken {
  locked?: boolean;
  name: string;
  family: string;
  step: Step;
  color: NormalizedColor;
  source: ColorSource;
  confidence: number;
}
export interface SemanticToken {
  name: string;
  primitiveToken: string | null;
  theme: Theme;
  reason?: string;
}
export interface ContrastChecks {
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  ui: boolean;
}
export interface ContrastResult {
  theme: Theme;
  foreground: string;
  background: string;
  foregroundToken: string;
  backgroundToken: string;
  ratio: number;
  checks: ContrastChecks;
  criterion: "text" | "ui";
  pass: boolean;
  suggestion?: { token: string; ratio: number };
}
export interface AnalysisReport {
  url: string;
  hostname: string;
  colors: NormalizedColor[];
  families: ColorFamily[];
  primitives: ColorToken[];
  semantics: SemanticToken[];
  contrast: ContrastResult[];
  warnings: string[];
  stats: {
    discovered: number;
    unique: number;
    families: number;
    generated: number;
    contrastIssues: number;
  };
}
export type ProgressCallback = (stage: string) => void;

/** A curated candidate, never an automatically accepted palette member. */
export interface SourceColor {
  id: string;
  color: NormalizedColor;
  variants: NormalizedColor[];
  origin: "extracted" | "manual";
  usefulness: number;
  curated: boolean;
  reasons: string[];
}
export interface Anchor {
  step: Step;
  color: NormalizedColor;
  locked: boolean;
  origin: "extracted" | "manual";
  sourceColorId?: string;
}
export interface PaletteStop {
  step: Step;
  color: NormalizedColor;
  source: "anchor" | "generated";
  locked: boolean;
  anchorOrigin?: "extracted" | "manual";
}
export interface GenerationSettings {
  mode: "auto";
  lightness: "balanced" | "soft";
  chroma: "auto" | "muted";
  hue: "preserve" | "blend";
}
export interface Palette {
  id: string;
  name: string;
  anchors: Anchor[];
  stops: PaletteStop[];
  settings: GenerationSettings;
  warnings: string[];
}
export interface PaletteSuggestion {
  name: string;
  sourceIds: string[];
  confidence: number;
}
export interface SourceAnalysis {
  url: string;
  hostname: string;
  colors: NormalizedColor[];
  sources: SourceColor[];
  suggestions: PaletteSuggestion[];
  warnings: string[];
  stats: { discovered: number; unique: number; useful: number };
}
