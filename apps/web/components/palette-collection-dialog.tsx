"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { normalizeColor } from "../../../packages/core/src/color";
import {
  createCustomPalette,
  createPalette,
  paletteSlug,
} from "../../../packages/core/src/palettes";
import { suggestPaletteName } from "../../../packages/core/src/naming";
import type {
  Palette,
  SourceColor,
  Step,
} from "../../../packages/core/src/models";
import { STEPS } from "../../../packages/core/src/models";
import { Select, SelectOption } from "./select";

export function PaletteCollectionDialog({
  sources,
  existingNames,
  onClose,
  onSubmit,
}: {
  sources?: SourceColor[];
  existingNames: string[];
  onClose: () => void;
  onSubmit: (palettes: Palette[]) => void;
}) {
  const batch = Boolean(sources?.length);
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState(() => {
    const names = [...existingNames];
    return (sources?.length ? sources : [undefined, undefined]).map(
      (source) => {
        const value = source
          ? source.color.inSrgbGamut
            ? source.color.hex
            : source.color.css
          : "";
        const name = source
          ? (suggestPaletteName(value, names) ?? "Palette")
          : "";
        names.push(name);
        return {
          id: crypto.randomUUID(),
          value,
          name,
          step: 500 as Step,
          source,
        };
      },
    );
  });
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function update(id: string, change: Partial<(typeof rows)[number]>) {
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, ...change } : row)),
    );
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const colors = rows.map((row) => {
        const color =
          row.source &&
          (row.value === row.source.color.css ||
            row.value === row.source.color.hex)
            ? row.source.color
            : normalizeColor(row.value);
        if (!color)
          throw new Error(
            "Enter a usable HEX, RGB, or OKLCH color in each row.",
          );
        return color;
      });
      const slugs = [...existingNames.map(paletteSlug)];
      const palettes = batch
        ? rows.map((row, index) =>
            createPalette(
              row.name,
              [
                {
                  step: row.step,
                  color: colors[index],
                  locked: true,
                  origin:
                    colors[index] === row.source?.color
                      ? row.source.origin
                      : "manual",
                  sourceColorId:
                    colors[index] === row.source?.color
                      ? row.source.id
                      : undefined,
                },
              ],
              crypto.randomUUID(),
            ),
          )
        : [createCustomPalette(name, colors, crypto.randomUUID())];
      for (const palette of palettes) {
        const slug = paletteSlug(palette.name);
        if (slugs.includes(slug))
          throw new Error("Choose a unique name for each palette.");
        slugs.push(slug);
      }
      onSubmit(palettes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create palettes.",
      );
    }
  }
  const title = batch ? "Create palettes from selection" : "Add custom palette";
  return (
    <dialog
      ref={dialog}
      className="builder-dialog collection-dialog"
      data-mode={batch ? "batch" : "custom"}
      aria-label={title}
      onCancel={onClose}
    >
      <form onSubmit={submit}>
        <header>
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button button-text"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </header>
        {!batch && (
          <label className="field">
            Palette name
            <input
              aria-label="Palette name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={48}
            />
          </label>
        )}
        <div className="collection-rows">
          {rows.map((row, index) => (
            <div className="collection-row" key={row.id}>
              {batch && (
                <label className="field">
                  Palette {index + 1}
                  <input
                    aria-label={`Palette ${index + 1} name`}
                    value={row.name}
                    onChange={(event) =>
                      update(row.id, { name: event.target.value })
                    }
                    required
                    maxLength={48}
                  />
                </label>
              )}
              <label className="field">
                {batch ? "Anchor" : `Color ${index + 1}`}
                <input
                  aria-label={`Color ${index + 1}`}
                  value={row.value}
                  placeholder="#7C3AED · rgb(…) · oklch(…)"
                  onChange={(event) =>
                    update(row.id, { value: event.target.value })
                  }
                  required
                />
              </label>
              {batch ? (
                <label className="field">
                  Position
                  <Select
                    aria-label={`Position ${index + 1}`}
                    value={row.step}
                    onValueChange={(value) =>
                      update(row.id, { step: Number(value) as Step })
                    }
                  >
                    {STEPS.map((step) => (
                      <SelectOption key={step}>{step}</SelectOption>
                    ))}
                  </Select>
                </label>
              ) : (
                <button
                  type="button"
                  className="icon-button button-text"
                  aria-label={`Remove color ${index + 1}`}
                  disabled={rows.length === 1}
                  onClick={() =>
                    setRows((previous) =>
                      previous.filter((item) => item.id !== row.id),
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!batch && (
          <button
            type="button"
            className="text-button"
            disabled={rows.length >= 256}
            onClick={() =>
              setRows((previous) => [
                ...previous,
                {
                  id: crypto.randomUUID(),
                  value: "",
                  name: "",
                  step: 500,
                  source: undefined,
                },
              ])
            }
          >
            <Plus size={14} /> Add another color
          </button>
        )}
        <p className="muted dialog-note">
          {batch
            ? "Each anchor creates its own OKLCH scale. Original colors stay locked."
            : "Keep exactly these colors in this order. No additional colors are generated."}
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <footer>
          <button type="button" className="button-text" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">
            {batch ? `Create ${rows.length} palettes` : "Add palette"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
