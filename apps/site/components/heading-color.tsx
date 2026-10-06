"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check, Palette, X } from "lucide-react";

const choices = [
  { name: "Purple", value: "var(--purple-600)" },
  { name: "Orange", value: "var(--orange-600)" },
  { name: "Green", value: "var(--green-600)" },
  { name: "Lagoon", value: "var(--lagoon)" },
];

type ColorValues = { hex: string; rgb: string; oklch: string };

export function HeadingColor() {
  const text = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const mode = useRef<"selection" | "manual">("selection");
  const [selected, setSelected] = useState(0);
  const [inspected, setInspected] = useState(0);
  const [values, setValues] = useState<(ColorValues | null)[]>([]);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const show = (rect: DOMRect) => {
    const desktop = window.matchMedia("(min-width: 801px)").matches;
    const width = desktop ? 392 : 200;
    const height = desktop ? 244 : 48;
    setPosition({
      left: Math.max(
        12,
        Math.min(
          rect.left + rect.width / 2 - width / 2,
          innerWidth - width - 12,
        ),
      ),
      top:
        rect.bottom + height + 10 > innerHeight
          ? Math.max(12, rect.top - height - 10)
          : rect.bottom + 10,
    });
  };

  useEffect(() => {
    let pending = 0;
    let selecting = false;
    const updateSelection = () => {
      pending = 0;
      if (selecting) return;
      const selection = window.getSelection();
      if (
        selection &&
        !selection.isCollapsed &&
        text.current?.contains(selection.anchorNode) &&
        text.current.contains(selection.focusNode)
      ) {
        mode.current = "selection";
        const rects = selection.getRangeAt(0).getClientRects();
        if (rects.length) show(rects[rects.length - 1]);
      } else if (
        selection &&
        popup.current?.contains(selection.anchorNode) &&
        popup.current.contains(selection.focusNode)
      ) {
        // Keep the panel open when visitors select a displayed color value.
        return;
      } else if (mode.current === "selection") setPosition(null);
    };
    const onSelection = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(updateSelection);
    };
    const dismiss = () => setPosition(null);
    const onPointer = (event: PointerEvent) => {
      selecting = !!text.current?.contains(event.target as Node);
      if (
        !text.current?.contains(event.target as Node) &&
        !popup.current?.contains(event.target as Node)
      )
        dismiss();
    };
    const onPointerEnd = () => {
      if (selecting) {
        selecting = false;
        onSelection();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && popup.current) {
        dismiss();
        trigger.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("selectionchange", onSelection);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("pointerup", onPointerEnd);
    document.addEventListener("pointercancel", onPointerEnd);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      cancelAnimationFrame(pending);
      document.removeEventListener("selectionchange", onSelection);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("pointerup", onPointerEnd);
      document.removeEventListener("pointercancel", onPointerEnd);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, []);

  const open = position !== null;
  useEffect(() => {
    if (!open || !window.matchMedia("(min-width: 801px)").matches) return;
    let cancelled = false;
    import("../../../packages/core/src/color")
      .then(({ normalizeColor, displayOklch }) => {
        const styles = getComputedStyle(document.documentElement);
        const next = choices.map((choice) => {
          const token = choice.value.slice(4, -1);
          const color = normalizeColor(styles.getPropertyValue(token).trim());
          return color
            ? { hex: color.hex, rgb: color.rgb, oklch: displayOklch(color) }
            : null;
        });
        if (!cancelled) setValues(next);
      })
      .catch(() => {
        if (!cancelled) setValues([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const openManually = () => {
    mode.current = "manual";
    if (text.current) show(text.current.getBoundingClientRect());
  };
  return (
    <>
      <span
        ref={text}
        className="heading-color-text"
        style={{ "--heading-choice": choices[selected].value } as CSSProperties}
      >
        color system.
      </span>
      <button
        ref={trigger}
        className="heading-color-trigger"
        type="button"
        aria-label="Choose heading text color"
        aria-haspopup="dialog"
        aria-expanded={position !== null}
        onClick={() => {
          openManually();
          requestAnimationFrame(() =>
            popup.current
              ?.querySelector<HTMLButtonElement>("button[aria-pressed=true]")
              ?.focus(),
          );
        }}
      >
        <Palette size={18} aria-hidden="true" />
      </button>
      {position &&
        createPortal(
          <div
            ref={popup}
            className="heading-color-popup"
            role="dialog"
            aria-label="Heading color"
            style={position}
            onMouseLeave={() => setInspected(selected)}
          >
            <div className="heading-color-options">
              {choices.map((choice, index) => (
                <button
                  key={choice.name}
                  className="heading-color-swatch"
                  type="button"
                  aria-label={choice.name}
                  aria-pressed={selected === index}
                  style={{ background: choice.value }}
                  onMouseEnter={() => setInspected(index)}
                  onFocus={() => setInspected(index)}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    setSelected(index);
                    setInspected(index);
                    setPosition(null);
                    const selection = window.getSelection();
                    if (
                      selection &&
                      text.current?.contains(selection.anchorNode)
                    )
                      selection.removeAllRanges();
                    if (event.detail === 0)
                      trigger.current?.focus({ preventScroll: true });
                  }}
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    style={{ opacity: selected === index ? 1 : 0 }}
                  />
                </button>
              ))}
              <button
                type="button"
                className="heading-color-close"
                aria-label="Close color choices"
                onClick={(event) => {
                  setPosition(null);
                  if (event.detail === 0)
                    trigger.current?.focus({ preventScroll: true });
                }}
              >
                <X size={15} />
              </button>
            </div>
            <div className="heading-color-details">
              <div className="heading-color-detail-title">
                <span style={{ background: choices[inspected].value }} />
                {choices[inspected].name}
                <small>Color values</small>
              </div>
              <dl>
                <div>
                  <dt>HEX</dt>
                  <dd>
                    <code>{values[inspected]?.hex ?? "—"}</code>
                  </dd>
                </div>
                <div>
                  <dt>RGB</dt>
                  <dd>
                    <code>{values[inspected]?.rgb ?? "—"}</code>
                  </dd>
                </div>
                <div>
                  <dt>OKLCH</dt>
                  <dd>
                    <code>{values[inspected]?.oklch ?? "—"}</code>
                  </dd>
                </div>
              </dl>
              <p>Preview a swatch. Choose it to apply.</p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
