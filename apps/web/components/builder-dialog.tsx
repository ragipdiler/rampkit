"use client";
import { Select, SelectOption } from "./select";
import { useEffect, useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  STEPS,
  type Anchor,
  type SourceColor,
  type Step,
} from "../../../packages/core/src/models";
import { normalizeColor } from "../../../packages/core/src/color";
import { suggestPaletteName } from "../../../packages/core/src/naming";
export type BuilderDialogSpec = {
  kind: "palette" | "manual" | "anchor" | "rename";
  name?: string;
  sources?: SourceColor[];
  paletteId?: string;
  existingNames?: string[];
  step?: Step;
  steps?: Step[];
};
export function BuilderDialog({
  spec,
  onClose,
  onSubmit,
}: {
  spec: BuilderDialogSpec;
  onClose: () => void;
  onSubmit: (data: { name: string; anchors: Anchor[]; value: string }) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(spec.name ?? "");
  const [nameEdited, setNameEdited] = useState(Boolean(spec.name?.trim()));
  const hintId = useId();
  const [error, setError] = useState("");
  const [rows, setRows] = useState(() => {
    const sources = spec.sources ?? [];
    const used = new Set<number>();
    return (sources.length ? sources : [undefined]).map((source, index) => {
      const named = source?.variants
        .flatMap((v) =>
          v.sources.flatMap((s) =>
            s.cssVariableName ? [s.cssVariableName] : [],
          ),
        )
        .map((n) =>
          Number(
            n.match(/-(25|50|100|200|300|400|500|600|700|800|900|950)$/)?.[1],
          ),
        )
        .find((n) => STEPS.includes(n as Step));
      let step =
        spec.steps?.[index] ??
        spec.step ??
        (named as Step | undefined) ??
        ([500, 800, 50, 300, 900] as const)[index] ??
        STEPS[index];
      if (used.has(step)) step = STEPS.find((s) => !used.has(s))!;
      used.add(step);
      return {
        value: source
          ? source.color.inSrgbGamut
            ? source.color.hex
            : source.color.css
          : "",
        step,
        source,
      };
    });
  });
  const suggestion =
    spec.kind === "palette"
      ? suggestPaletteName(rows[0].value, spec.existingNames)
      : null;
  const paletteName =
    spec.kind === "palette" && !nameEdited ? (suggestion ?? "") : name;
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const title =
    spec.kind === "palette"
      ? "Create Palette"
      : spec.kind === "manual"
        ? "Add color"
        : spec.kind === "anchor"
          ? "Add anchor"
          : "Rename palette";
  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const anchors = rows.map((row) => {
        const unchanged =
          row.source &&
          (row.value === row.source.color.hex ||
            row.value === row.source.color.css);
        const color = unchanged ? row.source!.color : normalizeColor(row.value);
        if (!color && spec.kind !== "rename")
          throw new Error("Enter a usable HEX, RGB, or OKLCH color.");
        return {
          step: row.step,
          color: color!,
          locked: true,
          origin: unchanged ? row.source!.origin : ("manual" as const),
          sourceColorId: unchanged ? row.source!.id : undefined,
        };
      });
      onSubmit({ name: paletteName, anchors, value: rows[0].value });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not apply this change.",
      );
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      className="builder-dialog"
      aria-label={title}
    >
      <form onSubmit={submit}>
        <header>
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button button-text"
            onClick={onClose}
            title="Close"
            aria-label="Close dialog"
          >
            <X size={14} />
          </button>
        </header>
        {(spec.kind === "palette" || spec.kind === "rename") && (
          <label className="field">
            {spec.kind === "rename" ? "New name" : "Palette name"}
            <input
              aria-label={spec.kind === "rename" ? "New name" : "Palette name"}
              value={paletteName}
              onChange={(e) => {
                setName(e.target.value);
                setNameEdited(true);
              }}
              aria-describedby={suggestion && !nameEdited ? hintId : undefined}
              placeholder="Suggested from anchor color"
              required
              maxLength={48}
              autoFocus
            />
            {suggestion && !nameEdited && (
              <span className="muted palette-name-hint" id={hintId}>
                Suggested from the first anchor color. Edit to rename.
              </span>
            )}
          </label>
        )}
        {spec.kind !== "rename" &&
          rows.map((row, index) => (
            <div className="anchor-fields" key={index}>
              <label className="field">
                {spec.kind === "manual"
                  ? "Color"
                  : index === 0
                    ? "Anchor"
                    : `Anchor ${index + 1}`}
                <input
                  value={row.value}
                  onChange={(e) =>
                    setRows((previous) =>
                      previous.map((r, i) =>
                        i === index ? { ...r, value: e.target.value } : r,
                      ),
                    )
                  }
                  placeholder="#7C3AED · rgb(…) · oklch(…)"
                  required
                  autoFocus={spec.kind === "manual" || spec.kind === "anchor"}
                />
              </label>
              {spec.kind !== "manual" && (
                <label className="field">
                  {index === 0 ? "Position" : `Position ${index + 1}`}
                  <Select
                    aria-label={
                      index === 0 ? "Position" : `Position ${index + 1}`
                    }
                    value={row.step}
                    onValueChange={(value) =>
                      setRows((previous) =>
                        previous.map((r, i) =>
                          i === index
                            ? { ...r, step: Number(value) as Step }
                            : r,
                        ),
                      )
                    }
                  >
                    {STEPS.map((step) => (
                      <SelectOption key={step}>{step}</SelectOption>
                    ))}
                  </Select>
                </label>
              )}
            </div>
          ))}
        {spec.kind === "palette" && rows.length < 12 && (
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setRows((previous) => [
                ...previous,
                {
                  value: "",
                  step: STEPS.find((s) => !previous.some((r) => r.step === s))!,
                  source: undefined,
                },
              ])
            }
          >
            <Plus size={14} /> Add another anchor
          </button>
        )}
        {spec.kind === "palette" && (
          <p className="muted dialog-note">
            Anchors are locked. Missing stops are generated in OKLCH.
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <footer>
          <button className="button-text" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">{title}</button>
        </footer>
      </form>
    </dialog>
  );
}
