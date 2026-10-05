"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Download,
  Upload,
  Plus,
  Minus,
  Maximize,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Hand,
  MousePointer2,
} from "lucide-react";
import { z } from "zod";
import { AppleColorPicker } from "./ui/apple-color-picker";
import { pickerCss } from "../../../packages/core/src/picker";
import { PaintStudio } from "./paint-studio";
import { SectionTabs } from "./section-tabs";
import { Select, SelectOption } from "./select";
import { normalizeColor } from "../../../packages/core/src/color";
import type {
  Palette,
  SourceColor,
  ColorToken,
} from "../../../packages/core/src/models";

const colorSchema = z.object({
  css: z
    .string()
    .max(200)
    .refine((value) => !!normalizeColor(value)),
  hex: z.string().max(20),
  label: z.string().max(200),
  origin: z.enum(["Generated", "Anchor", "Source", "Manual", "Token"]),
});
const nodeSchema = z.object({
  id: z.string().max(100),
  x: z.number().finite(),
  y: z.number().finite(),
  label: z.string().max(200),
  note: z.string().max(1000).optional(),
  colors: z.array(colorSchema).max(24),
});
const studySchema = z.object({
  format: z.literal("rampkit-color-study"),
  version: z.literal(1),
  nodes: z.array(nodeSchema).max(1000),
});
type CanvasNode = z.infer<typeof nodeSchema>;
type Camera = { x: number; y: number; zoom: number };
type Gesture = {
  kind: "pan" | "move";
  pointerId: number;
  startX: number;
  startY: number;
  camera: Camera;
  nodes: CanvasNode[];
  ids: string[];
};
const widthOf = (node: CanvasNode) =>
  node.colors.length > 1 ? Math.max(240, node.colors.length * 56) : 168;
const heightOf = (node: CanvasNode) => (node.note !== undefined ? 144 : 132);
const initialCamera = { x: 48, y: 48, zoom: 1 };

/** A separate study surface. Canvas edits never mutate source colors or tokens. */
function StudyCanvas({
  sources,
  palettes,
  tokens,
}: {
  sources: SourceColor[];
  palettes: Palette[];
  tokens: ColorToken[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [samplePicker, setSamplePicker] = useState(false);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [camera, setCamera] = useState<Camera>(initialCamera);
  const [selection, setSelection] = useState<string[]>([]);
  const [tool, setTool] = useState("select");
  const [space, setSpace] = useState(false);
  const [colorInput, setColorInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [paletteId, setPaletteId] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [past, setPast] = useState<CanvasNode[][]>([]);
  const [future, setFuture] = useState<CanvasNode[][]>([]);
  const viewport = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1;
      setCamera((current) => {
        if (!event.ctrlKey && !event.metaKey)
          return {
            ...current,
            x: current.x - event.deltaX * unit,
            y: current.y - event.deltaY * unit,
          };
        const zoom = Math.max(
          0.1,
          Math.min(4, current.zoom * Math.exp(-event.deltaY * unit * 0.003)),
        );
        const x = event.clientX - bounds.left,
          y = event.clientY - bounds.top;
        return {
          zoom,
          x: x - ((x - current.x) * zoom) / current.zoom,
          y: y - ((y - current.y) * zoom) / current.zoom,
        };
      });
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", wheel);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  function commit(next: CanvasNode[], previous = nodes) {
    setPast((history) => [...history.slice(-49), previous]);
    setFuture([]);
    setNodes(next);
    setError("");
  }
  function undo() {
    if (!past.length) return;
    setFuture((history) => [nodes, ...history]);
    setNodes(past[past.length - 1]);
    setPast(past.slice(0, -1));
    setSelection([]);
  }
  function redo() {
    if (!future.length) return;
    setPast((history) => [...history, nodes]);
    setNodes(future[0]);
    setFuture(future.slice(1));
    setSelection([]);
  }
  function addNode(data: Pick<CanvasNode, "label" | "colors" | "note">) {
    const bounds = viewport.current?.getBoundingClientRect();
    const node: CanvasNode = { ...data, id: crypto.randomUUID(), x: 0, y: 0 };
    const width = widthOf(node),
      height = heightOf(node);
    const originX = (24 - camera.x) / camera.zoom,
      originY = (24 - camera.y) / camera.zoom;
    const columns = Math.max(
      1,
      Math.floor(((bounds?.width ?? 800) / camera.zoom - 48) / (width + 24)),
    );
    for (let index = 0; index <= nodes.length * 8 + 8; index++) {
      node.x = originX + (index % columns) * (width + 24);
      node.y = originY + Math.floor(index / columns) * (height + 24);
      if (
        !nodes.some(
          (existing) =>
            node.x < existing.x + widthOf(existing) + 8 &&
            node.x + width + 8 > existing.x &&
            node.y < existing.y + heightOf(existing) + 8 &&
            node.y + height + 8 > existing.y,
        )
      )
        break;
    }
    commit([...nodes, node]);
    setSelection([node.id]);
    setMessage(`${data.label} added to your study.`);
  }
  function addManual() {
    const color = normalizeColor(colorInput);
    if (!color || color.alpha === 0) {
      setError("Enter a usable HEX, RGB or OKLCH color.");
      return;
    }
    addNode({
      label: color.hex,
      colors: [
        { css: color.css, hex: color.hex, label: color.hex, origin: "Manual" },
      ],
    });
    setColorInput("");
  }
  function duplicate() {
    const copies = nodes
      .filter((node) => selection.includes(node.id))
      .map((node) => ({
        ...node,
        id: crypto.randomUUID(),
        x: node.x + 24,
        y: node.y + 24,
      }));
    if (!copies.length) return;
    commit([...nodes, ...copies]);
    setSelection(copies.map((node) => node.id));
  }
  function remove() {
    if (selection.length) {
      commit(nodes.filter((node) => !selection.includes(node.id)));
      setSelection([]);
    }
  }
  function zoomAt(zoom: number, x: number, y: number) {
    setCamera((current) => {
      const next = Math.max(0.1, Math.min(4, zoom));
      return {
        zoom: next,
        x: x - ((x - current.x) * next) / current.zoom,
        y: y - ((y - current.y) * next) / current.zoom,
      };
    });
  }
  function fit() {
    if (!nodes.length) {
      setCamera(initialCamera);
      return;
    }
    const bounds = viewport.current?.getBoundingClientRect();
    if (!bounds) return;
    const left = Math.min(...nodes.map((node) => node.x)),
      top = Math.min(...nodes.map((node) => node.y));
    const right = Math.max(...nodes.map((node) => node.x + widthOf(node))),
      bottom = Math.max(...nodes.map((node) => node.y + heightOf(node)));
    const zoom = Math.max(
      0.1,
      Math.min(
        1.5,
        (bounds.width - 96) / (right - left),
        (bounds.height - 96) / (bottom - top),
      ),
    );
    setCamera({
      zoom,
      x: (bounds.width - (right - left) * zoom) / 2 - left * zoom,
      y: (bounds.height - (bottom - top) * zoom) / 2 - top * zoom,
    });
  }
  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 && event.button !== 1) return;
    const id = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-canvas-node]",
    )?.dataset.canvasNode;
    if (samplePicker && id) {
      const value =
        (event.target as HTMLElement).closest<HTMLElement>(
          "[data-picker-color]",
        )?.dataset.pickerColor ??
        nodes.find((n) => n.id === id)?.colors[0]?.css;
      if (value) {
        setColorInput(value);
        setSamplePicker(false);
        setMessage("Study color sampled. Add it as a new independent swatch.");
        event.preventDefault();
        return;
      }
    }
    const pan = tool === "pan" || space || event.button === 1 || !id;
    let ids = selection;
    if (!pan && id) {
      ids = event.shiftKey
        ? selection.includes(id)
          ? selection.filter((item) => item !== id)
          : [...selection, id]
        : selection.includes(id)
          ? selection
          : [id];
      setSelection(ids);
    } else if (!id && !space && tool !== "pan" && event.button === 0)
      setSelection([]);
    viewport.current?.focus();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      kind: pan ? "pan" : "move",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      camera,
      nodes,
      ids,
    };
  }
  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX - active.startX,
      dy = event.clientY - active.startY;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (active.kind === "pan")
        setCamera({
          ...active.camera,
          x: active.camera.x + dx,
          y: active.camera.y + dy,
        });
      else
        setNodes(
          active.nodes.map((node) =>
            active.ids.includes(node.id)
              ? {
                  ...node,
                  x: node.x + dx / active.camera.zoom,
                  y: node.y + dy / active.camera.zoom,
                }
              : node,
          ),
        );
    });
  }
  function pointerUp(event: ReactPointerEvent<HTMLDivElement>, cancel = false) {
    const active = gesture.current;
    if (!active) return;
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    if (active.kind === "move") {
      const dx = event.clientX - active.startX,
        dy = event.clientY - active.startY;
      if (cancel) setNodes(active.nodes);
      else if (Math.abs(dx) + Math.abs(dy) > 2)
        commit(
          active.nodes.map((node) =>
            active.ids.includes(node.id)
              ? {
                  ...node,
                  x: node.x + dx / active.camera.zoom,
                  y: node.y + dy / active.camera.zoom,
                }
              : node,
          ),
          active.nodes,
        );
      else setNodes(active.nodes);
    }
    if (active.kind === "pan")
      setCamera(
        cancel
          ? active.camera
          : {
              ...active.camera,
              x: active.camera.x + event.clientX - active.startX,
              y: active.camera.y + event.clientY - active.startY,
            },
      );
    gesture.current = null;
  }
  function save() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { format: "rampkit-color-study", version: 1, nodes },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "rampkit-color-study.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage("Study downloaded. Import it to continue later.");
  }
  async function load(file: File) {
    try {
      if (file.size > 2_000_000)
        throw new Error("Study files must be under 2 MB.");
      const result = studySchema.safeParse(JSON.parse(await file.text()));
      if (!result.success)
        throw new Error("Choose a valid Rampkit color study JSON file.");
      const imported = result.data.nodes.map((node) => ({
        ...node,
        id: crypto.randomUUID(),
        colors: node.colors.map((color) => ({
          ...color,
          css: normalizeColor(color.css)!.css,
          hex: normalizeColor(color.css)!.hex,
        })),
      }));
      commit(imported);
      setSelection([]);
      setCamera(initialCamera);
      setMessage("Study imported. Undo restores the previous board.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not read this study.",
      );
    }
  }
  return (
    <div className="canvas-workspace">
      {pickerOpen && (
        <AppleColorPicker
          initialColor={
            normalizeColor(colorInput)?.hex.slice(0, 7) ?? "#007aff"
          }
          initialOpacity={normalizeColor(colorInput)?.alpha ?? 1}
          recentColors={recentColors}
          onRemember={(hex) =>
            setRecentColors((old) =>
              [hex, ...old.filter((c) => c !== hex)].slice(0, 12),
            )
          }
          onChange={(hex, opacity) => setColorInput(pickerCss(hex, opacity))}
          onClose={() => setPickerOpen(false)}
          onSample={() => {
            setSamplePicker(true);
            setTool("select");
            setMessage("Click a study swatch to sample its color.");
          }}
        />
      )}
      <div className="canvas-add-toolbar">
        <button
          className="button-secondary canvas-picker-trigger"
          aria-label="Open study color picker"
          onClick={() => setPickerOpen(true)}
        >
          <span
            style={{ background: normalizeColor(colorInput)?.hex ?? "#007aff" }}
          />
          Colors
        </button>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            addManual();
          }}
        >
          <input
            aria-label="Canvas color"
            placeholder="HEX, RGB or OKLCH"
            value={colorInput}
            onChange={(event) => setColorInput(event.target.value)}
          />
          <button className="button-secondary" type="submit">
            <Plus size={14} />
            Color
          </button>
        </form>
        <label>
          Palette
          <Select
            searchable
            aria-label="Canvas palette"
            value={paletteId}
            onValueChange={setPaletteId}
            disabled={!palettes.length}
          >
            <SelectOption value="">Choose palette</SelectOption>
            {palettes.map((palette) => (
              <SelectOption key={palette.id} value={palette.id}>
                {palette.name}
              </SelectOption>
            ))}
          </Select>
        </label>
        <button
          className="button-outline"
          disabled={!palettes.some((palette) => palette.id === paletteId)}
          onClick={() => {
            const palette = palettes.find(
              (palette) => palette.id === paletteId,
            )!;
            addNode({
              label: palette.name,
              colors: palette.stops.map((stop) => ({
                css: stop.color.css,
                hex: stop.color.hex,
                label: String(stop.step),
                origin: stop.source === "generated" ? "Generated" : "Anchor",
              })),
            });
          }}
        >
          Add palette
        </button>
        <label>
          Source
          <Select
            searchable
            aria-label="Canvas source"
            value={sourceId}
            onValueChange={setSourceId}
            disabled={!sources.length}
          >
            <SelectOption value="">Choose color</SelectOption>
            {sources.map((source) => (
              <SelectOption key={source.id} value={source.id}>
                {source.color.hex}
              </SelectOption>
            ))}
          </Select>
        </label>
        <button
          className="button-text"
          disabled={!sources.some((source) => source.id === sourceId)}
          onClick={() => {
            const source = sources.find((source) => source.id === sourceId)!;
            addNode({
              label: source.color.hex,
              colors: [
                {
                  css: source.color.css,
                  hex: source.color.hex,
                  label: source.color.hex,
                  origin: "Source",
                },
              ],
            });
          }}
        >
          Add source
        </button>
      </div>
      <div className="canvas-add-toolbar">
        <label>
          Token
          <Select
            searchable
            aria-label="Canvas token"
            value={tokenName}
            onValueChange={setTokenName}
            disabled={!tokens.length}
          >
            <SelectOption value="">Choose token</SelectOption>
            {tokens.map((token) => (
              <SelectOption key={token.name} value={token.name}>
                {token.name}
              </SelectOption>
            ))}
          </Select>
        </label>
        <button
          className="button-text"
          disabled={!tokens.some((token) => token.name === tokenName)}
          onClick={() => {
            const token = tokens.find((token) => token.name === tokenName)!;
            addNode({
              label: token.name,
              colors: [
                {
                  css: token.color.css,
                  hex: token.color.hex,
                  label: token.name,
                  origin: token.source === "generated" ? "Generated" : "Anchor",
                },
              ],
            });
          }}
        >
          Add token
        </button>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (noteInput.trim()) {
              addNode({ label: "Note", note: noteInput.trim(), colors: [] });
              setNoteInput("");
            }
          }}
        >
          <input
            aria-label="Canvas note"
            maxLength={1000}
            placeholder="A note for your color study"
            value={noteInput}
            onChange={(event) => setNoteInput(event.target.value)}
          />
          <button className="button-text" disabled={!noteInput.trim()}>
            Add note
          </button>
        </form>
        <div className="canvas-file-actions">
          <button className="button-outline" onClick={save}>
            <Download size={14} />
            Save study
          </button>
          <button
            className="button-text"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={14} />
            Import study
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-label="Import color study"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void load(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div
        className="canvas-board"
        ref={viewport}
        tabIndex={0}
        role="region"
        aria-label="Infinite color canvas"
        aria-describedby="canvas-help"
        data-tool={space ? "pan" : tool}
        style={{
          backgroundPosition: `${camera.x}px ${camera.y}px`,
          backgroundSize: `${24 * camera.zoom}px ${24 * camera.zoom}px`,
        }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={(event) => pointerUp(event)}
        onPointerCancel={(event) => pointerUp(event, true)}
        onContextMenu={(event) => event.preventDefault()}

        onBlur={() => {
          setSpace(false);
        }}
        onKeyUp={(event) => {
          if (event.code === "Space") setSpace(false);
        }}
        onKeyDown={(event) => {
          const key = event.key.toLowerCase(),
            cmd = event.metaKey || event.ctrlKey;
          if (event.code === "Space") {
            event.preventDefault();
            setSpace(true);
          } else if (cmd && key === "z") {
            event.preventDefault();
            if (event.shiftKey) redo();
            else undo();
          } else if (cmd && key === "d") {
            event.preventDefault();
            duplicate();
          } else if (cmd && key === "a") {
            event.preventDefault();
            setSelection(nodes.map((node) => node.id));
          } else if (key === "delete" || key === "backspace") {
            event.preventDefault();
            remove();
          } else if (key === "escape") setSelection([]);
          else if (key === "0") {
            event.preventDefault();
            fit();
          } else if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
              event.key,
            ) &&
            selection.length
          ) {
            event.preventDefault();
            const distance = event.shiftKey ? 16 : 4;
            commit(
              nodes.map((node) =>
                selection.includes(node.id)
                  ? {
                      ...node,
                      x:
                        node.x +
                        (event.key === "ArrowRight"
                          ? distance
                          : event.key === "ArrowLeft"
                            ? -distance
                            : 0),
                      y:
                        node.y +
                        (event.key === "ArrowDown"
                          ? distance
                          : event.key === "ArrowUp"
                            ? -distance
                            : 0),
                    }
                  : node,
              ),
            );
          }
        }}
      >
        {!nodes.length && (
          <div className="canvas-empty">
            <h2>A place to think in color</h2>
            <p>
              Add a color, palette or note. Pan in any direction and build your
              own color study.
            </p>
            <small>
              Canvas objects are independent snapshots. Your palettes and tokens
              stay unchanged.
            </small>
          </div>
        )}
        <div
          className="canvas-world"
          style={{
            transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.zoom})`,
          }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              data-canvas-node={node.id}
              className={`canvas-node${selection.includes(node.id) ? " is-selected" : ""}`}
              style={{ left: node.x, top: node.y, width: widthOf(node) }}
              role="button"
              tabIndex={0}
              aria-label={`Canvas object ${node.label}`}
              aria-pressed={selection.includes(node.id)}
              onFocus={() =>
                setSelection((current) =>
                  current.includes(node.id) ? current : [node.id],
                )
              }
            >
              <div className="canvas-node-heading">{node.label}</div>
              {node.note !== undefined ? (
                <p className="canvas-node-note" title={node.note}>
                  {node.note}
                </p>
              ) : (
                <div className="canvas-node-colors">
                  {node.colors.map((color, index) => (
                    <div
                      key={index}
                      title={`${color.label} · ${color.hex} · ${color.origin}`}
                    >
                      <span
                        data-picker-color={color.css}
                        style={{ background: color.css }}
                      />
                      <small>
                        {node.colors.length > 1 ? color.label : color.hex}
                      </small>
                      <small>{color.origin}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="canvas-controls">
        <div role="group" aria-label="Canvas tools">
          <button
            className="icon-button button-text"
            aria-label="Select tool"
            aria-pressed={tool === "select"}
            onClick={() => setTool("select")}
          >
            <MousePointer2 size={14} />
          </button>
          <button
            className="icon-button button-text"
            aria-label="Pan tool"
            aria-pressed={tool === "pan"}
            onClick={() => setTool("pan")}
          >
            <Hand size={14} />
          </button>
        </div>
        <button
          className="icon-button button-text"
          aria-label="Undo canvas change"
          disabled={!past.length}
          onClick={undo}
        >
          <Undo2 size={14} />
        </button>
        <button
          className="icon-button button-text"
          aria-label="Redo canvas change"
          disabled={!future.length}
          onClick={redo}
        >
          <Redo2 size={14} />
        </button>
        <button
          className="icon-button button-text"
          aria-label="Duplicate selected objects"
          disabled={!selection.length}
          onClick={duplicate}
        >
          <Copy size={14} />
        </button>
        <button
          className="icon-button button-danger"
          aria-label="Delete selected objects"
          disabled={!selection.length}
          onClick={remove}
        >
          <Trash2 size={14} />
        </button>
        <span className="muted">
          {nodes.length} objects · {selection.length} selected
        </span>
        <div className="canvas-zoom">
          <button
            className="icon-button button-text"
            aria-label="Zoom out"
            onClick={() =>
              zoomAt(
                camera.zoom / 1.2,
                (viewport.current?.clientWidth ?? 800) / 2,
                (viewport.current?.clientHeight ?? 500) / 2,
              )
            }
          >
            <Minus size={14} />
          </button>
          <span aria-label="Canvas zoom">{Math.round(camera.zoom * 100)}%</span>
          <button
            className="icon-button button-text"
            aria-label="Zoom in"
            onClick={() =>
              zoomAt(
                camera.zoom * 1.2,
                (viewport.current?.clientWidth ?? 800) / 2,
                (viewport.current?.clientHeight ?? 500) / 2,
              )
            }
          >
            <Plus size={14} />
          </button>
          <button
            className="icon-button button-text"
            aria-label="Fit canvas objects"
            onClick={fit}
          >
            <Maximize size={14} />
          </button>
        </div>
      </div>
      <p id="canvas-help" className="canvas-help">
        Drag background / scroll to pan · Ctrl/⌘ + scroll to zoom · Space + drag
        to pan · Shift + click to select · Arrow keys to move · ⌘/Ctrl D to
        duplicate · Save study to keep your work.
      </p>
      <span className="sr-only" role="status">
        {message}
      </span>
    </div>
  );
}

export function ColorCanvas(props: {
  sources: SourceColor[];
  palettes: Palette[];
  tokens: ColorToken[];
  onDiscover: (colors: string[], gradient: boolean) => void;
}) {
  const [mode, setMode] = useState("paint");
  return (
    <div className="canvas-atelier">
      <SectionTabs
        workspacePage="Canvas"
        id="canvas-mode"
        label="Canvas mode"
        value={mode}
        onChange={setMode}
        items={[
          { value: "paint", label: "Painting" },
          { value: "studies", label: "Color studies" },
        ]}
      />
      <div
        id="canvas-mode-panel"
        role="tabpanel"
        aria-labelledby={`canvas-mode-${mode}`}
        className="canvas-mode-panel"
      >
        <div hidden={mode !== "paint"} className="canvas-mode-mount">
          <PaintStudio
            palettes={props.palettes}
            sources={props.sources}
            onDiscover={props.onDiscover}
          />
        </div>
        <div hidden={mode !== "studies"} className="canvas-mode-mount">
          <StudyCanvas
            sources={props.sources}
            palettes={props.palettes}
            tokens={props.tokens}
          />
        </div>
      </div>
    </div>
  );
}
