"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Paintbrush,
  Droplets,
  Hand,
  Pipette,
  MoveRight,
  Undo2,
  Redo2,
  Minus,
  Plus,
  Maximize,
  Download,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { z } from "zod";
import { AppleColorPicker } from "./ui/apple-color-picker";
import {
  PaintField,
  PAINT_CELL,
  type Brush,
  type PaintPoint,
  type PaintStroke,
} from "../../../packages/core/src/painting";
import type { Palette, SourceColor } from "../../../packages/core/src/models";

const starterPaints = [
  { name: "Ultramarine", hex: "#002185" },
  { name: "Golden yellow", hex: "#fcd200" },
  { name: "Vermilion", hex: "#c74329" },
  { name: "Rose", hex: "#b52562" },
  { name: "Viridian", hex: "#1b725a" },
  { name: "Titanium white", hex: "#faf7ef" },
  { name: "Ivory black", hex: "#252723" },
];
const pointSchema = z.object({
  x: z.number().finite().min(-1e7).max(1e7),
  y: z.number().finite().min(-1e7).max(1e7),
  pressure: z.number().min(0).max(1),
  time: z.number().finite().min(0),
});
const strokeSchema = z.object({
  pigment: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  brush: z.enum(["round", "flat", "wash"]),
  size: z.number().min(8).max(120),
  load: z.number().min(0.1).max(1),
  wetness: z.number().min(0).max(1),
  blend: z.boolean(),
  opacity: z.number().min(0).max(1).default(1),
  points: z.array(pointSchema).min(1).max(5000),
});
const paintingSchema = z
  .object({
    format: z.literal("rampkit-painting"),
    version: z.literal(1),
    strokes: z.array(strokeSchema).max(1000),
  })
  .refine(
    (v) => v.strokes.reduce((n, s) => n + s.points.length, 0) <= 50000,
    "Painting is too large.",
  );
type Camera = { x: number; y: number; zoom: number };
type Tool = "paint" | "blend" | "collect" | "gradient" | "pan";
type Gesture = {
  tool: Tool;
  pointerId: number;
  start: PaintPoint;
  last: PaintPoint;
  camera: Camera;
  screen: { x: number; y: number };
  stroke?: PaintStroke;
  work: number;
};
const cameraStart = { x: 0, y: 0, zoom: 1 };
const MAX_WORK = 20_000_000;
function strokeWork(stroke: PaintStroke) {
  return (
    stroke.points.length * (stroke.size / PAINT_CELL) ** 2 +
    stroke.points
      .slice(1)
      .reduce(
        (n, p, i) =>
          n +
          (Math.hypot(p.x - stroke.points[i].x, p.y - stroke.points[i].y) *
            stroke.size) /
            PAINT_CELL ** 2,
        0,
      )
  );
}
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PaintStudio({
  palettes,
  sources,
  onDiscover,
}: {
  palettes: Palette[];
  sources: SourceColor[];
  onDiscover: (colors: string[], gradient: boolean) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [paintOpacity, setPaintOpacity] = useState(1);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [sampleForPicker, setSampleForPicker] = useState(false);
  const [tool, setTool] = useState<Tool>("paint");
  const [brush, setBrush] = useState<Brush>("round");
  const [paint, setPaint] = useState(starterPaints[0]);
  const [paintPage, setPaintPage] = useState(0);
  const [size, setSize] = useState(48),
    [load, setLoad] = useState(0.8),
    [wetness, setWetness] = useState(0.9);
  const [camera, setCamera] = useState<Camera>(cameraStart);
  const [past, setPast] = useState<PaintStroke[][]>([]);
  const [history, setHistory] = useState<PaintStroke[]>([]),
    [future, setFuture] = useState<PaintStroke[][]>([]);
  const [found, setFound] = useState<string[]>([]),
    [isGradient, setIsGradient] = useState(false);
  const [message, setMessage] = useState(
    "Choose a paint, then brush across the paper. Wet colors mingle where they meet.",
  );
  const canvas = useRef<HTMLCanvasElement>(null),
    file = useRef<HTMLInputElement>(null);
  const field = useRef(new PaintField()),
    cameraRef = useRef(cameraStart),
    gesture = useRef<Gesture | null>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null),
    space = useRef(false);
  const usedWork = history.reduce(
    (total, stroke) => total + strokeWork(stroke),
    0,
  );
  const usedPoints = history.reduce(
    (total, stroke) => total + stroke.points.length,
    0,
  );
  const draw = useCallback(() => {
    const element = canvas.current;
    if (!element) return;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const { width, height } = element.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (
      element.width !== Math.round(width * ratio) ||
      element.height !== Math.round(height * ratio)
    ) {
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    const c = cameraRef.current;
    ctx.translate(c.x, c.y);
    ctx.scale(c.zoom, c.zoom);
    for (const cell of field.current.cells.values()) {
      const sx = cell.x * c.zoom + c.x,
        sy = cell.y * c.zoom + c.y;
      if (
        sx < -PAINT_CELL * c.zoom ||
        sy < -PAINT_CELL * c.zoom ||
        sx > width ||
        sy > height
      )
        continue;
      ctx.fillStyle = cell.display;
      ctx.fillRect(cell.x, cell.y, PAINT_CELL, PAINT_CELL);
    }
    ctx.globalAlpha = 1;
    const g = gesture.current;
    if (g?.tool === "gradient") {
      ctx.strokeStyle = "#252723";
      ctx.lineWidth = 1 / c.zoom;
      ctx.setLineDash([4 / c.zoom, 4 / c.zoom]);
      ctx.beginPath();
      ctx.moveTo(g.start.x, g.start.y);
      ctx.lineTo(g.last.x, g.last.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, []);
  const scheduleDraw = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      draw();
    });
  }, [draw]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(scheduleDraw);
    observer.observe(element);
    function wheel(event: WheelEvent) {
      event.preventDefault();
      const c = cameraRef.current;
      let next: Camera;
      if (event.ctrlKey || event.metaKey) {
        const rect = element!.getBoundingClientRect(),
          x = event.clientX - rect.left,
          y = event.clientY - rect.top;
        const zoom = Math.max(
          0.1,
          Math.min(4, c.zoom * Math.exp(-event.deltaY * 0.005)),
        );
        next = {
          x: x - ((x - c.x) * zoom) / c.zoom,
          y: y - ((y - c.y) * zoom) / c.zoom,
          zoom,
        };
      } else next = { ...c, x: c.x - event.deltaX, y: c.y - event.deltaY };
      cameraRef.current = next;
      setCamera(next);
      scheduleDraw();
    }
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      element.removeEventListener("wheel", wheel);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [scheduleDraw]);
  function changeCamera(next: Camera) {
    cameraRef.current = next;
    setCamera(next);
    scheduleDraw();
  }
  function point(event: ReactPointerEvent<HTMLCanvasElement>): PaintPoint {
    const rect = event.currentTarget.getBoundingClientRect(),
      c = cameraRef.current;
    return {
      x: (event.clientX - rect.left - c.x) / c.zoom,
      y: (event.clientY - rect.top - c.y) / c.zoom,
      pressure: event.pointerType === "pen" ? event.pressure : 0.7,
      time: Date.now(),
    };
  }
  function collect(colors: string[], gradient: boolean) {
    if (!colors.length) {
      setMessage(
        "Brush some paint onto the paper first, then collect from the painted area.",
      );
      return;
    }
    setIsGradient(gradient);
    setFound((old) =>
      gradient ? colors : [...new Set([...old, ...colors])].slice(0, 12),
    );
    setMessage(
      gradient
        ? "Color journey collected from your brushwork. Create a palette to keep it."
        : "Paint color collected. Use it as paint or keep it in a palette.",
    );
  }
  function start(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event),
      active = space.current || event.button === 1 ? "pan" : tool;
    if (active === "collect") {
      const hex = field.current.sample(p.x, p.y);
      if (sampleForPicker && hex) {
        setPaint({ name: "Sampled paint", hex });
        setPaintOpacity(1);
        setTool("paint");
        setSampleForPicker(false);
        setMessage("Sampled paint is ready on your brush.");
      } else collect(hex ? [hex] : [], false);
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    const stroke: PaintStroke | undefined =
      active === "paint" || active === "blend"
        ? {
            pigment: paint.hex,
            opacity: paintOpacity,
            brush,
            size,
            load,
            wetness,
            blend: active === "blend",
            points: [p],
          }
        : undefined;
    const work = stroke ? strokeWork(stroke) : 0;
    if (
      stroke &&
      (history.length >= 1000 ||
        usedPoints >= 50000 ||
        usedWork + work > MAX_WORK)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setMessage(
        "This painting is full. Save it, then clear the paper to begin another study.",
      );
      return;
    }
    gesture.current = {
      work,
      tool: active,
      pointerId: event.pointerId,
      start: p,
      last: p,
      camera: cameraRef.current,
      screen: { x: event.clientX, y: event.clientY },
      stroke,
    };
    if (stroke) {
      field.current.begin();
      field.current.stamp(p, stroke);
    }
    scheduleDraw();
  }
  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    const r = event.currentTarget.getBoundingClientRect();
    if (cursor.current) {
      const diameter = size * cameraRef.current.zoom;
      Object.assign(cursor.current.style, {
        left: `${event.clientX - r.left}px`,
        top: `${event.clientY - r.top}px`,
        width: `${diameter}px`,
        height: `${diameter * (brush === "flat" ? 0.45 : 1)}px`,
        opacity: tool === "paint" || tool === "blend" ? "1" : "0",
      });
    }
    const g = gesture.current;
    if (!g || g.pointerId !== event.pointerId) return;
    if (g.tool === "pan") {
      changeCamera({
        ...g.camera,
        x: g.camera.x + event.clientX - g.screen.x,
        y: g.camera.y + event.clientY - g.screen.y,
      });
      return;
    }
    const p = point(event);
    const addedWork = g.stroke
      ? (g.stroke.size / PAINT_CELL) ** 2 +
        (Math.hypot(p.x - g.last.x, p.y - g.last.y) * g.stroke.size) /
          PAINT_CELL ** 2
      : 0;
    if (
      g.stroke &&
      (g.stroke.points.length >= 5000 ||
        usedPoints + g.stroke.points.length >= 50000 ||
        usedWork + g.work + addedWork > MAX_WORK)
    ) {
      setMessage(
        "Lift the brush to finish this stroke. Save your painting before beginning a fresh study.",
      );
      return;
    }
    if (g.stroke) {
      g.work += addedWork;
      field.current.segment(g.last, p, g.stroke);
      g.stroke.points.push(p);
    }
    g.last = p;
    scheduleDraw();
  }
  function finish(event: ReactPointerEvent<HTMLCanvasElement>) {
    const g = gesture.current;
    if (!g || g.pointerId !== event.pointerId) return;
    if (g.stroke) {
      setPast((old) => [...old.slice(-49), history]);
      setHistory((old) => [...old, g.stroke!]);
      setFuture([]);
      setMessage(
        "Brushwork stays here while you explore Rampkit. Save painting before leaving or reloading.",
      );
    }
    if (g.tool === "gradient")
      collect(field.current.gradient(g.start, g.last), true);
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    scheduleDraw();
  }
  function restore(next: PaintStroke[]) {
    gesture.current = null;
    field.current.replay(next);
    setHistory(next);
    scheduleDraw();
  }
  function undo() {
    const next = past.at(-1);
    if (!next) return;
    setPast(past.slice(0, -1));
    setFuture((old) => [...old, history]);
    restore(next);
  }
  function redo() {
    const next = future.at(-1);
    if (!next) return;
    setFuture(future.slice(0, -1));
    setPast((old) => [...old, history]);
    restore(next);
  }
  function fit() {
    const cells = [...field.current.cells.values()],
      element = canvas.current;
    if (!cells.length || !element) {
      changeCamera(cameraStart);
      return;
    }
    let left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    for (const c of cells) {
      left = Math.min(left, c.x);
      top = Math.min(top, c.y);
      right = Math.max(right, c.x + PAINT_CELL);
      bottom = Math.max(bottom, c.y + PAINT_CELL);
    }
    const zoom = Math.max(
      0.1,
      Math.min(
        2,
        (element.clientWidth - 80) / (right - left),
        (element.clientHeight - 80) / (bottom - top),
      ),
    );
    changeCamera({
      zoom,
      x: (element.clientWidth - (right - left) * zoom) / 2 - left * zoom,
      y: (element.clientHeight - (bottom - top) * zoom) / 2 - top * zoom,
    });
  }
  async function importPainting(selected: File | undefined) {
    if (!selected) return;
    try {
      if (selected.size > 10_000_000)
        throw new Error("Choose a painting smaller than 10 MB.");
      const parsed = paintingSchema.parse(JSON.parse(await selected.text()));
      // Bound replay work independently of JSON size before touching the current painting.
      const work = parsed.strokes.reduce(
        (sum, stroke) => sum + strokeWork(stroke),
        0,
      );
      if (work > MAX_WORK)
        throw new Error(
          "This painting is too complex to open. Keep studies smaller.",
        );
      setPast((old) => [...old, history]);
      setFuture([]);
      restore(parsed.strokes);
      fit();
      setMessage("Painting opened. Undo restores your previous painting.");
    } catch (error) {
      setMessage(
        error instanceof z.ZodError
          ? "This file is not a valid Rampkit painting."
          : error instanceof Error
            ? error.message
            : "Could not open painting.",
      );
    }
    if (file.current) file.current.value = "";
  }
  const paints = [
    ...starterPaints.map((p) => ({ ...p, opacity: 1 })),
    ...palettes.flatMap((p) =>
      p.stops.map((s) => ({
        name: `${p.name} ${s.step} · ${s.source === "generated" ? "Generated" : "Anchor"}`,
        hex: s.color.hex.slice(0, 7),
        opacity: s.color.alpha,
      })),
    ),
    ...sources.slice(0, 24).map((s, i) => ({
      name: `Source paint ${i + 1}`,
      hex: s.color.hex.slice(0, 7),
      opacity: s.color.alpha,
    })),
  ];
  const paintPages = Math.ceil(paints.length / 6);
  const visiblePaintPage = Math.min(paintPage, paintPages - 1);
  const visiblePaints = paints.slice(
    visiblePaintPage * 6,
    (visiblePaintPage + 1) * 6,
  );
  const tools: { value: Tool; label: string; icon: typeof Paintbrush }[] = [
    { value: "paint", label: "Paint", icon: Paintbrush },
    { value: "blend", label: "Blend", icon: Droplets },
    { value: "collect", label: "Collect color", icon: Pipette },
    { value: "gradient", label: "Collect gradient", icon: MoveRight },
    { value: "pan", label: "Move paper", icon: Hand },
  ];
  return (
    <div className="paint-studio">
      <div className="paint-tool-row">
        <div className="paint-tools" role="group" aria-label="Painting tools">
          {tools.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              className="button-text"
              aria-pressed={tool === value}
              onClick={() => {
                setSampleForPicker(false);
                setTool(value);
              }}
              title={label}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <div className="inline-actions">
          <button
            className="button-text"
            aria-label="Undo paint stroke"
            disabled={!past.length}
            onClick={undo}
          >
            <Undo2 size={14} />
          </button>
          <button
            className="button-danger"
            aria-label="Clear painting"
            title="Clear paper (Undo restores it)"
            disabled={!history.length}
            onClick={() => {
              setPast((old) => [...old.slice(-49), history]);
              setFuture([]);
              restore([]);
              setMessage("Fresh paper. Undo restores your painting.");
            }}
          >
            <Trash2 size={14} />
          </button>
          <button
            className="button-text"
            aria-label="Redo paint stroke"
            disabled={!future.length}
            onClick={redo}
          >
            <Redo2 size={14} />
          </button>
        </div>
      </div>
      <div className={`paint-paper tool-${tool}`}>
        <div className="paint-materials" aria-label="Floating paint supplies">
          <div className="paint-palette-row">
            <button
              className="button-secondary canvas-picker-trigger"
              aria-label="Open paint color picker"
              onClick={() => setPickerOpen(true)}
            >
              <span style={{ background: paint.hex, opacity: paintOpacity }} />
              Colors
            </button>
            <button
              className="icon-button button-text"
              aria-label="Previous paint colors"
              disabled={visiblePaintPage === 0}
              onClick={() => setPaintPage(visiblePaintPage - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="paint-tubes" role="group" aria-label="Paint tubes">
              {visiblePaints.map((p, i) => (
                <button
                  className="paint-tube"
                  key={`${p.name}-${i}`}
                  aria-label={`Use ${p.name} paint`}
                  aria-pressed={
                    paint.name === p.name &&
                    paint.hex === p.hex &&
                    paintOpacity === p.opacity
                  }
                  title={p.name}
                  onClick={() => {
                    setPaint(p);
                    setPaintOpacity(p.opacity);
                    setSampleForPicker(false);
                    setTool("paint");
                  }}
                  style={{ "--pigment": p.hex } as React.CSSProperties}
                >
                  <span />
                </button>
              ))}
            </div>
            <button
              className="icon-button button-text"
              aria-label="Next paint colors"
              disabled={visiblePaintPage === paintPages - 1}
              onClick={() => setPaintPage(visiblePaintPage + 1)}
            >
              <ChevronRight size={14} />
            </button>
            <span className="paint-page-status" aria-label="Paint color page">
              {visiblePaintPage + 1}/{paintPages}
            </span>
          </div>
          <span className="paint-name" title={paint.name}>
            {paint.name}
          </span>
          <div className="paint-brush-settings">
            <div
              className="paint-brushes"
              role="group"
              aria-label="Brush shape"
            >
              {(["round", "flat", "wash"] as const).map((b) => (
                <button
                  key={b}
                  className="button-text"
                  aria-pressed={brush === b}
                  onClick={() => setBrush(b)}
                >
                  {b[0].toUpperCase() + b.slice(1)}
                </button>
              ))}
            </div>
            <label>
              Brush size
              <input
                aria-label="Brush size"
                type="range"
                min="8"
                max="120"
                step="4"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </label>
            <label>
              Paint load
              <input
                aria-label="Paint load"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={load}
                onChange={(e) => setLoad(Number(e.target.value))}
              />
            </label>
            <label>
              Wetness
              <input
                aria-label="Paint wetness"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={wetness}
                onChange={(e) => setWetness(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <canvas
          ref={canvas}
          aria-label="Infinite painting paper"
          aria-describedby="paint-help"
          tabIndex={0}
          onPointerDown={start}
          onPointerMove={move}
          onPointerLeave={() => {
            if (cursor.current) cursor.current.style.opacity = "0";
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
          onLostPointerCapture={finish}
          onBlur={() => {
            space.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === " ") {
              e.preventDefault();
              space.current = true;
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
              e.preventDefault();
              if (e.shiftKey) redo();
              else undo();
            }
            if (e.key.startsWith("Arrow")) {
              e.preventDefault();
              changeCamera({
                ...cameraRef.current,
                x:
                  cameraRef.current.x +
                  (e.key === "ArrowLeft"
                    ? 40
                    : e.key === "ArrowRight"
                      ? -40
                      : 0),
                y:
                  cameraRef.current.y +
                  (e.key === "ArrowUp" ? 40 : e.key === "ArrowDown" ? -40 : 0),
              });
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " ") space.current = false;
          }}
        >
          Paint with a pointer or pen. Choose paint tubes and brush settings
          above; collect colors to make a palette.
        </canvas>
        <div ref={cursor} className="paint-brush-cursor" aria-hidden="true" />
        {!history.length && (
          <div className="paint-paper-hint" aria-hidden="true">
            <Paintbrush size={24} />
            <span>A little pigment. Endless possibility.</span>
          </div>
        )}
        <div className="paint-viewport-tools">
          <button
            className="button-text"
            aria-label="Zoom out painting"
            onClick={() =>
              changeCamera({
                ...cameraRef.current,
                zoom: Math.max(0.1, camera.zoom / 1.2),
              })
            }
          >
            <Minus size={14} />
          </button>
          <span>{Math.round(camera.zoom * 100)}%</span>
          <button
            className="button-text"
            aria-label="Zoom in painting"
            onClick={() =>
              changeCamera({
                ...cameraRef.current,
                zoom: Math.min(4, camera.zoom * 1.2),
              })
            }
          >
            <Plus size={14} />
          </button>
          <button
            className="button-text"
            aria-label="Fit painting"
            onClick={fit}
          >
            <Maximize size={14} />
          </button>
        </div>
      </div>
      <div className="paint-discoveries">
        <button
          className="button-text"
          disabled={!history.length}
          title="Gather up to twelve distinct colors from the whole painting"
          onClick={() => {
            const colors = field.current.gather();
            setFound(colors);
            setIsGradient(false);
            setMessage(
              "Distinct colors gathered from the whole painting. Collect color can add a particular detail.",
            );
          }}
        >
          Gather colors
        </button>
        <span>{isGradient ? "Found gradient" : "Found colors"}</span>
        {found.length ? (
          <>
            <div className={`paint-found ${isGradient ? "is-gradient" : ""}`}>
              {found.map((hex, i) => (
                <button
                  key={`${hex}-${i}`}
                  aria-label={`Paint with discovered color ${i + 1}`}
                  title="Use this discovered paint"
                  style={{ background: hex }}
                  onClick={() => {
                    setPaint({ name: "Discovered paint", hex });
                    setTool("paint");
                  }}
                />
              ))}
            </div>
            <button
              className="primary"
              onClick={() => onDiscover(found, isGradient)}
            >
              Create palette
            </button>
            <button className="button-text" onClick={() => setFound([])}>
              Clear collection
            </button>
            {isGradient && found.length > 1 && (
              <button
                className="button-text"
                onClick={() =>
                  download(
                    new Blob(
                      [
                        `.paint-gradient { background: linear-gradient(90deg, ${found.map((hex, i) => `${hex} ${((i / (found.length - 1)) * 100).toFixed(2)}%`).join(", ")}); }\n`,
                      ],
                      { type: "text/css" },
                    ),
                    "paint-gradient.css",
                  )
                }
              >
                Save gradient
              </button>
            )}
          </>
        ) : (
          <span className="muted">
            Collect a color or draw a journey through your painted colors.
          </span>
        )}
      </div>
      <div className="paint-footer">
        <p id="paint-help">{message}</p>
        <div className="inline-actions">
          <button
            className="button-text"
            disabled={!history.length}
            onClick={() =>
              download(
                new Blob(
                  [
                    JSON.stringify({
                      format: "rampkit-painting",
                      version: 1,
                      strokes: history,
                    }),
                  ],
                  { type: "application/json" },
                ),
                "rampkit-painting.json",
              )
            }
          >
            <Download size={14} />
            Save painting
          </button>
          <button className="button-text" onClick={() => file.current?.click()}>
            <Upload size={14} />
            Open painting
          </button>
          <button
            className="button-text"
            disabled={!history.length}
            onClick={() => {
              draw();
              canvas.current?.toBlob((blob) => {
                if (blob) download(blob, "rampkit-painting.png");
              });
            }}
          >
            Save image
          </button>
        </div>
      </div>
      {pickerOpen && (
        <AppleColorPicker
          initialColor={paint.hex}
          initialOpacity={paintOpacity}
          recentColors={recentColors}
          onRemember={(hex) =>
            setRecentColors((old) =>
              [hex, ...old.filter((c) => c !== hex)].slice(0, 12),
            )
          }
          onChange={(hex, opacity) => {
            setPaint({ name: "Custom paint", hex });
            setPaintOpacity(opacity);
            setTool("paint");
          }}
          onClose={() => setPickerOpen(false)}
          onSample={() => {
            setSampleForPicker(true);
            setTool("collect");
            setMessage(
              "Click painted paper to load that color onto your brush.",
            );
          }}
        />
      )}
      <input
        hidden
        ref={file}
        type="file"
        accept=".json,application/json"
        aria-label="Open painting file"
        onChange={(e) => void importPainting(e.target.files?.[0])}
      />
      <span className="sr-only" role="status">
        {message}
      </span>
    </div>
  );
}
