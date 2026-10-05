import { normalizeColor } from "./color";
import { Color, mix } from "spectral.js";

export type Brush = "round" | "flat" | "wash";
export type PaintPoint = {
  x: number;
  y: number;
  pressure: number;
  time: number;
};
export type PaintStroke = {
  pigment: string;
  opacity?: number;
  brush: Brush;
  size: number;
  load: number;
  wetness: number;
  blend: boolean;
  points: PaintPoint[];
};
export type PaintCell = {
  x: number;
  y: number;
  hex: string;
  display: string;
  opacity: number;
  time: number;
  wetness: number;
};
export const PAINT_CELL = 1;
const pigments = new Map<string, Color>();
const mixtures = new Map<string, string>();
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
function pigment(hex: string) {
  let color = pigments.get(hex);
  if (!color) {
    if (pigments.size > 4096) pigments.clear();
    color = new Color(hex);
    pigments.set(hex, color);
  }
  return color;
}
/** Reconstructed reflectance / Kubelka–Munk approximation, never RGB averaging. */
export function mixPigments(a: string, b: string, amount: number): string {
  const t = clamp(Math.round(amount * 32) / 32);
  if (!t || a === b) return a;
  if (t === 1) return b;
  const key = `${a}:${b}:${t}`;
  let result = mixtures.get(key);
  if (!result) {
    result = mix([pigment(a), 1 - t], [pigment(b), t])
      .toString()
      .toLowerCase();
    if (mixtures.size > 16000) mixtures.clear();
    mixtures.set(key, result);
  }
  return result;
}
const keyOf = (x: number, y: number) =>
  `${Math.floor(x / PAINT_CELL)},${Math.floor(y / PAINT_CELL)}`;
const grain = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/** Sparse unbounded pigment field. All paint mechanics are independent from React. */
export class PaintField {
  readonly cells = new Map<string, PaintCell>();
  private carried: string | null = null;
  begin() {
    this.carried = null;
  }
  sample(x: number, y: number): string | null {
    const cell = this.cells.get(keyOf(x, y));
    if (!cell) return null;
    return cell.display;
  }
  stamp(point: PaintPoint, stroke: PaintStroke) {
    const radius = (stroke.size * (0.45 + clamp(point.pressure) * 0.55)) / 2;
    const center = this.cells.get(keyOf(point.x, point.y));
    if (stroke.blend && !this.carried && center) this.carried = center.hex;
    if (stroke.blend && !this.carried) return;
    let incoming = stroke.blend ? this.carried! : stroke.pigment;
    if (center && !stroke.blend) {
      const wet =
        center.wetness *
        Math.exp(-Math.max(0, point.time - center.time) / 90000);
      if (wet > 0.05)
        incoming = mixPigments(
          incoming,
          center.hex,
          wet * stroke.wetness * 0.18,
        );
    }
    const extentY = stroke.brush === "flat" ? radius * 0.45 : radius;
    for (
      let y = Math.floor((point.y - extentY) / PAINT_CELL);
      y <= Math.ceil((point.y + extentY) / PAINT_CELL);
      y++
    ) {
      for (
        let x = Math.floor((point.x - radius) / PAINT_CELL);
        x <= Math.ceil((point.x + radius) / PAINT_CELL);
        x++
      ) {
        const wx = (x + 0.5) * PAINT_CELL,
          wy = (y + 0.5) * PAINT_CELL;
        const distance =
          stroke.brush === "flat"
            ? Math.max(
                Math.abs(wx - point.x) / radius,
                Math.abs(wy - point.y) / extentY,
              )
            : Math.hypot(wx - point.x, wy - point.y) / radius;
        if (distance >= 1) continue;
        const edge =
          stroke.brush === "wash"
            ? (1 - distance) ** 1.6
            : Math.min(1, (1 - distance) * 5);
        const bristle = 0.78 + grain(x, y) * 0.22;
        const deposit = clamp(
          edge *
            bristle *
            stroke.load *
            (stroke.opacity ?? 1) *
            (stroke.brush === "wash" ? 0.18 : 0.65),
        );
        if (deposit <= 0) continue;
        const key = `${x},${y}`,
          old = this.cells.get(key);
        if (stroke.blend && !old) continue;
        let hex = incoming;
        if (old) {
          const wet =
            old.wetness * Math.exp(-Math.max(0, point.time - old.time) / 90000);
          const influence = stroke.blend
            ? deposit * 0.4
            : deposit / (deposit + old.opacity * wet * stroke.wetness + 0.01);
          hex = mixPigments(old.hex, incoming, influence);
        }
        const opacity = stroke.blend
          ? old!.opacity
          : clamp((old?.opacity ?? 0) + deposit * (1 - (old?.opacity ?? 0)));
        const display = `#${hex
          .slice(1)
          .match(/.{2}/g)!
          .map((c) =>
            Math.round(parseInt(c, 16) * opacity + 255 * (1 - opacity))
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")}`;
        this.cells.set(key, {
          display,
          x: x * PAINT_CELL,
          y: y * PAINT_CELL,
          hex,
          opacity,
          time: point.time,
          wetness: stroke.wetness,
        });
      }
    }
    if (stroke.blend && center)
      this.carried = mixPigments(this.carried!, center.hex, 0.25);
  }
  segment(from: PaintPoint, to: PaintPoint, stroke: PaintStroke) {
    const steps = Math.max(
      1,
      Math.ceil(
        Math.hypot(to.x - from.x, to.y - from.y) / Math.max(2, stroke.size / 8),
      ),
    );
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      this.stamp(
        {
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
          pressure: from.pressure + (to.pressure - from.pressure) * t,
          time: from.time + (to.time - from.time) * t,
        },
        stroke,
      );
    }
  }
  replay(strokes: PaintStroke[]) {
    this.cells.clear();
    for (const stroke of strokes) {
      this.begin();
      if (stroke.points[0]) this.stamp(stroke.points[0], stroke);
      for (let i = 1; i < stroke.points.length; i++)
        this.segment(stroke.points[i - 1], stroke.points[i], stroke);
    }
  }
  /** Representative discoveries from the entire painting, always exact painted colors. */
  gather(count = 12): string[] {
    const frequencies = new Map<string, number>();
    for (const cell of this.cells.values())
      frequencies.set(cell.display, (frequencies.get(cell.display) ?? 0) + 1);
    const buckets = new Map<string, { hex: string; count: number }>();
    for (const [hex, frequency] of [...frequencies].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )) {
      const key = hex
        .slice(1)
        .match(/../g)!
        .map((c) => Math.floor(parseInt(c, 16) / 16))
        .join(",");
      const bucket = buckets.get(key);
      if (bucket) bucket.count += frequency;
      else buckets.set(key, { hex, count: frequency });
    }
    const candidates = [...buckets.values()]
      .sort((a, b) => b.count - a.count || a.hex.localeCompare(b.hex))
      .map((b) => {
        const color = normalizeColor(b.hex)!;
        const radians = ((color.oklch.h ?? 0) * Math.PI) / 180;
        return {
          ...b,
          lab: [
            color.oklch.l,
            color.oklch.c * Math.cos(radians),
            color.oklch.c * Math.sin(radians),
          ],
        };
      });
    if (!candidates.length) return [];
    const selected = [candidates[0]];
    while (selected.length < Math.min(count, candidates.length)) {
      let best: (typeof candidates)[number] | undefined,
        score = 0;
      for (const candidate of candidates) {
        const distance = Math.min(
          ...selected.map((s) =>
            Math.hypot(...candidate.lab.map((v, i) => v - s.lab[i])),
          ),
        );
        const weighted =
          distance *
          (0.5 + 0.5 * Math.sqrt(candidate.count / candidates[0].count));
        if (distance > 0.035 && weighted > score) {
          best = candidate;
          score = weighted;
        }
      }
      if (!best) break;
      selected.push(best);
    }
    return selected.map((s) => s.hex);
  }
  gradient(from: PaintPoint, to: PaintPoint, count = 12): string[] {
    const found: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const value = this.sample(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
      );
      if (value && value !== found.at(-1)) found.push(value);
    }
    return found;
  }
}
