"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

const choices = [
  { name: "Purple", value: "var(--purple-600)" },
  { name: "Orange", value: "var(--orange-600)" },
  { name: "Green", value: "var(--green-600)" },
  { name: "Cyan", value: "var(--cyan-600)" },
];

export function HeadingColor() {
  const text = useRef<HTMLSpanElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const mode = useRef<"selection" | "manual">("selection");
  const [selected, setSelected] = useState(0);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const show = (rect: DOMRect) => {
    setPosition({
      left: Math.max(
        12,
        Math.min(rect.left + rect.width / 2 - 100, innerWidth - 212),
      ),
      top:
        rect.bottom + 62 > innerHeight
          ? Math.max(12, rect.top - 60)
          : rect.bottom + 10,
    });
  };

  useEffect(() => {
    let pending = 0;
    const updateSelection = () => {
      pending = 0;
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
      } else if (mode.current === "selection") setPosition(null);
    };
    const onSelection = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(updateSelection);
    };
    const dismiss = () => setPosition(null);
    const onPointer = (event: PointerEvent) => {
      if (
        !text.current?.contains(event.target as Node) &&
        !popup.current?.contains(event.target as Node)
      )
        dismiss();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && popup.current) {
        dismiss();
        text.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("selectionchange", onSelection);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      cancelAnimationFrame(pending);
      document.removeEventListener("selectionchange", onSelection);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, []);

  const openManually = () => {
    mode.current = "manual";
    if (text.current) show(text.current.getBoundingClientRect());
  };
  return (
    <>
      <span
        ref={text}
        className="heading-color-text"
        role="button"
        tabIndex={0}
        aria-label="color system. Choose text color"
        aria-haspopup="dialog"
        aria-expanded={position !== null}
        style={{ "--heading-choice": choices[selected].value } as CSSProperties}
        onClick={() => {
          if (window.getSelection()?.isCollapsed) openManually();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openManually();
            requestAnimationFrame(() =>
              popup.current
                ?.querySelector<HTMLButtonElement>("button[aria-pressed=true]")
                ?.focus(),
            );
          }
        }}
      >
        color system.
      </span>
      {position &&
        createPortal(
          <div
            ref={popup}
            className="heading-color-popup"
            role="dialog"
            aria-label="Heading color"
            style={position}
          >
            {choices.map((choice, index) => (
              <button
                key={choice.name}
                className="heading-color-swatch"
                type="button"
                aria-label={choice.name}
                aria-pressed={selected === index}
                style={{ background: choice.value }}
                onPointerDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  setSelected(index);
                  setPosition(null);
                  const selection = window.getSelection();
                  if (selection && text.current?.contains(selection.anchorNode))
                    selection.removeAllRanges();
                  if (event.detail === 0)
                    text.current?.focus({ preventScroll: true });
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
                  text.current?.focus({ preventScroll: true });
              }}
            >
              <X size={15} />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
