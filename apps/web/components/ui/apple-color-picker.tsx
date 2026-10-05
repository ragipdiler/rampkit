"use client";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type CSSProperties,
} from "react";
import { Pipette, Plus, X, Check } from "lucide-react";
import { SectionTabs } from "../section-tabs";
import { PICKER_GRID } from "./picker-grid";
import {
  pickerHex,
  pickerHsv,
  pickerRgb,
  pickerRgbHex,
} from "../../../../packages/core/src/picker";

/** Adapted from the supplied Apple-style picker; colors and alpha are controlled. */
export function AppleColorPicker({
  initialColor,
  initialOpacity = 1,
  recentColors,
  onRemember,
  onChange,
  onClose,
  onSample,
}: {
  initialColor: string;
  initialOpacity?: number;
  recentColors: string[];
  onRemember: (hex: string) => void;
  onChange: (hex: string, opacity: number) => void;
  onClose: () => void;
  onSample: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState("grid"),
    [hex, setHex] = useState(initialColor.slice(0, 7));
  const [opacity, setOpacity] = useState(initialOpacity),
    [draft, setDraft] = useState(initialColor.slice(1, 7));
  const hsv = pickerHsv(hex),
    rgb = pickerRgb(hex);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function close() {
    dialog.current?.close();
    onClose();
  }
  function choose(value: string, alpha = opacity) {
    const next = value.toLowerCase();
    setHex(next);
    setDraft(next.slice(1));
    setOpacity(alpha);
    onChange(next, alpha);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    const y = Math.max(
      0,
      Math.min(1, (event.clientY - rect.top) / rect.height),
    );
    choose(
      pickerHex({
        h: x * 360,
        s: Math.min(1, y * 2),
        v: Math.min(1, (1 - y) * 2),
      }),
    );
  }
  return (
    <dialog
      ref={dialog}
      className="color-picker-dialog"
      aria-labelledby="picker-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          close();
      }}
    >
      <header>
        <button
          className="button-text"
          aria-label="Sample canvas color"
          title="Collect a color from the canvas"
          onClick={() => {
            close();
            onSample();
          }}
        >
          <Pipette size={14} />
        </button>
        <h2 id="picker-title">Colors</h2>
        <button
          className="button-text"
          aria-label="Close color picker"
          onClick={close}
        >
          <X size={14} />
        </button>
      </header>
      <SectionTabs
        id="picker-mode"
        label="Color picker mode"
        value={tab}
        onChange={setTab}
        items={[
          { value: "grid", label: "Grid" },
          { value: "spectrum", label: "Spectrum" },
          { value: "sliders", label: "Sliders" },
        ]}
      />
      <div
        id="picker-mode-panel"
        role="tabpanel"
        aria-labelledby={`picker-mode-${tab}`}
        className="picker-view"
      >
        {tab === "grid" && (
          <div className="picker-grid" role="group" aria-label="Color grid">
            {PICKER_GRID.map((value, i) => (
              <button
                key={i}
                aria-label={`Choose ${value.toLowerCase()} color ${i + 1}`}
                aria-pressed={value.toLowerCase() === hex}
                style={{ background: value }}
                onClick={() => choose(value)}
              >
                {value.toLowerCase() === hex && <Check size={12} />}
              </button>
            ))}
          </div>
        )}
        {tab === "spectrum" && (
          <>
            <div
              className="picker-spectrum"
              aria-hidden="true"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                move(e);
              }}
              onPointerMove={move}
              onPointerUp={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId);
              }}
            >
              <span
                style={{
                  left: `${(hsv.h / 360) * 100}%`,
                  top: `${(hsv.v < 1 ? 1 - hsv.v / 2 : hsv.s / 2) * 100}%`,
                  background: hex,
                }}
              />
            </div>
            <label className="picker-range-label">
              Hue
              <input
                type="range"
                aria-label="Spectrum hue"
                style={
                  {
                    "--picker-track":
                      "linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                  } as CSSProperties
                }
                min="0"
                max="360"
                value={hsv.h}
                onChange={(e) =>
                  choose(pickerHex({ ...hsv, h: Number(e.target.value) }))
                }
              />
            </label>
            <label className="picker-range-label">
              Saturation
              <input
                type="range"
                aria-label="Spectrum saturation"
                style={
                  {
                    "--picker-track": `linear-gradient(90deg, ${pickerHex({ ...hsv, s: 0 })}, ${pickerHex({ ...hsv, s: 1 })})`,
                  } as CSSProperties
                }
                min="0"
                max="100"
                value={Math.round(hsv.s * 100)}
                onChange={(e) =>
                  choose(pickerHex({ ...hsv, s: Number(e.target.value) / 100 }))
                }
              />
            </label>
            <label className="picker-range-label">
              Brightness
              <input
                type="range"
                aria-label="Spectrum brightness"
                style={
                  {
                    "--picker-track": `linear-gradient(90deg, #000, ${pickerHex({ ...hsv, v: 1 })})`,
                  } as CSSProperties
                }
                min="0"
                max="100"
                value={Math.round(hsv.v * 100)}
                onChange={(e) =>
                  choose(pickerHex({ ...hsv, v: Number(e.target.value) / 100 }))
                }
              />
            </label>
          </>
        )}
        {tab === "sliders" && (
          <div className="picker-rgb">
            {["Red", "Green", "Blue"].map((label, i) => (
              <label key={label}>
                <span>{label}</span>
                <input
                  aria-label={`${label} slider`}
                  style={
                    {
                      "--picker-track": `linear-gradient(90deg, ${pickerRgbHex(rgb.map((c, index) => (index === i ? 0 : c)))}, ${pickerRgbHex(rgb.map((c, index) => (index === i ? 255 : c)))})`,
                    } as CSSProperties
                  }
                  type="range"
                  min="0"
                  max="255"
                  value={rgb[i]}
                  onChange={(e) =>
                    choose(
                      pickerRgbHex(
                        rgb.map((c, index) =>
                          index === i ? Number(e.target.value) : c,
                        ),
                      ),
                    )
                  }
                />
                <input
                  aria-label={`${label} value`}
                  type="number"
                  min="0"
                  max="255"
                  value={rgb[i]}
                  onChange={(e) =>
                    choose(
                      pickerRgbHex(
                        rgb.map((c, index) =>
                          index === i
                            ? Math.max(0, Math.min(255, Number(e.target.value)))
                            : c,
                        ),
                      ),
                    )
                  }
                />
              </label>
            ))}
            <label>
              <span>HEX</span>
              <input
                aria-label="Picker HEX"
                value={draft}
                maxLength={6}
                spellCheck={false}
                onChange={(e) => {
                  const value = e.target.value.replace(/^#/, "");
                  if (!/^[a-f\d]{0,6}$/i.test(value)) return;
                  setDraft(value);
                  if (value.length === 6) choose(`#${value}`);
                }}
                onBlur={() => setDraft(hex.slice(1))}
              />
            </label>
          </div>
        )}
      </div>
      <label className="picker-opacity">
        <span>Opacity</span>
        <input
          aria-label="Picker opacity"
          style={
            {
              "--picker-track": `linear-gradient(90deg, transparent, ${hex}), repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 / 8px 8px`,
            } as CSSProperties
          }
          type="range"
          min="0"
          max="100"
          value={Math.round(opacity * 100)}
          onChange={(e) => choose(hex, Number(e.target.value) / 100)}
        />
        <span>{Math.round(opacity * 100)}%</span>
      </label>
      <div className="picker-recents">
        <div
          className="picker-current"
          aria-label="Current color"
          style={{ background: hex, opacity }}
        />
        <div className="picker-recent-swatches">
          {recentColors.map((value) => (
            <button
              key={value}
              aria-label={`Use saved color ${value}`}
              style={{ background: value }}
              onClick={() => choose(value)}
            />
          ))}
          <button
            className="button-secondary"
            aria-label="Remember picker color"
            disabled={recentColors.includes(hex)}
            onClick={() => onRemember(hex)}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      <p className="picker-hint">
        Changes apply to your selected paint or study color.
      </p>
    </dialog>
  );
}
