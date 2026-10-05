import {
  normalizeOccurrences,
  detectFamilies,
  inferPositions,
  type SourceAnalysis,
  type ProgressCallback,
} from "../../core/src/index";
import { curateSourceColors } from "../../core/src/sources";
import { extractWebsite } from "./index";
/** Discovery only: no palette, primitive, semantic mapping, or generated stop is created here. */
export async function analyzeWebsite(
  url: string,
  onProgress: ProgressCallback = () => {},
  signal?: AbortSignal,
): Promise<SourceAnalysis> {
  const extraction = await extractWebsite(url, onProgress, signal);
  onProgress("Normalizing colors…");
  const colors = normalizeOccurrences(extraction.occurrences);
  if (!colors.length)
    throw new Error("Page loaded but no usable colors were detected.");
  onProgress("Curating source colors…");
  const sources = curateSourceColors(colors);
  onProgress("Finding palette suggestions…");
  const families = inferPositions(
    detectFamilies(sources.filter((s) => s.curated).map((s) => s.color)),
  );
  const suggestions = families.map((f) => ({
    name: f.name[0].toUpperCase() + f.name.slice(1),
    confidence: f.confidence,
    sourceIds: f.members
      .slice(0, 3)
      .map((m) => sources.find((s) => s.color.id === m.color.id)!.id),
  }));
  return {
    url: extraction.url,
    hostname: new URL(extraction.url).hostname,
    colors,
    sources,
    suggestions,
    warnings: extraction.warnings,
    stats: {
      discovered: colors.reduce((sum, c) => sum + c.usageCount, 0),
      unique: colors.length,
      useful: sources.filter((s) => s.curated).length,
    },
  };
}
