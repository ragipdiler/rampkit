"use client";
import { CopyButton } from "./copy-button";
import { SectionTabs } from "./section-tabs";
import { useId, useState } from "react";
import { X, LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { displayOklch } from "../../../packages/core/src/color";
import { paletteSlug } from "../../../packages/core/src/palettes";
import type {
  SourceColor,
  Palette,
  PaletteStop,
} from "../../../packages/core/src/models";
function CopyValue({
  label,
  value,
  copy,
}: {
  label: string;
  value: string;
  copy: (value: string) => Promise<void>;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <CopyButton
          className="cell-value"
          iconPosition="end"
          onCopy={() => copy(value)}
          title={`Copy ${label}`}
          aria-label={`Copy ${label}: ${value}`}
        >
          <span>{value}</span>
        </CopyButton>
      </dd>
    </div>
  );
}
export function SourceInspector({
  source,
  onClose,
  onIgnore,
  onCreate,
  copy,
}: {
  source: SourceColor;
  onClose: () => void;
  onIgnore: () => void;
  onCreate: () => void;
  copy: (value: string) => Promise<void>;
}) {
  const [section, setSection] = useState("color");
  const id = useId();
  const occurrences = source.variants.flatMap((v) => v.sources);
  return (
    <aside className="inspector" aria-label="Source inspector">
      <header>
        <h2>Source color</h2>
        <button
          className="icon-button button-text"
          onClick={onClose}
          title="Close inspector (Esc)"
          aria-label="Close inspector"
        >
          <X size={14} />
        </button>
      </header>
      <SectionTabs
        id={id}
        label="Source inspector sections"
        value={section}
        onChange={setSection}
        items={[
          { value: "color", label: "Color" },
          {
            value: "evidence",
            label: "Evidence",
            count: source.variants.length,
          },
        ]}
      />
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${section}`}
        tabIndex={0}
      >
        {section === "color" && (
          <>
            <div
              className="inspector-preview"
              style={{ background: source.color.css }}
            />
            <div className="inspector-actions">
              <button className="primary" onClick={onCreate}>
                Create palette
              </button>
              <button className="button-text" onClick={onIgnore}>
                Ignore color
              </button>
            </div>
            <h2>{source.color.hex}</h2>
            <dl>
              <CopyValue label="HEX" value={source.color.hex} copy={copy} />
              <CopyValue label="OKLCH" value={source.color.css} copy={copy} />
              <CopyValue label="RGB" value={source.color.rgb} copy={copy} />
              <dt>Origin</dt>
              <dd>{source.origin === "manual" ? "Manual" : "Website"}</dd>
              <dt>Usage</dt>
              <dd>
                {source.variants.reduce((n, v) => n + v.usageCount, 0)} rendered
                occurrences
              </dd>
              <dt>Used as</dt>
              <dd>
                {[
                  ...new Set(
                    occurrences
                      .filter((s) => s.kind === "rendered")
                      .map((s) => s.cssProperty),
                  ),
                ].join(", ") || "Manual anchor candidate"}
              </dd>
              <dt>Variables</dt>
              <dd>
                {[
                  ...new Set(
                    occurrences.flatMap((s) =>
                      s.cssVariableName ? [s.cssVariableName] : [],
                    ),
                  ),
                ].join(", ") || "None"}
              </dd>
            </dl>
          </>
        )}
        {section === "evidence" && (
          <section className="evidence" aria-label="Original evidence">
            <p className="muted">
              Usefulness {Math.round(source.usefulness)}/100.{" "}
              {source.reasons.join(". ")}.
            </p>
            {source.variants.map((v) => (
              <div key={v.id}>
                <strong>{v.hex}</strong>
                <p className="muted">
                  Alpha {v.alpha.toFixed(3)} · {v.usageCount} uses
                </p>
                <p>{displayOklch(v)}</p>
                {v.sources.map((s, i) => (
                  <p className="muted" key={i}>
                    {s.originalValue} · {s.cssProperty} ·{" "}
                    {s.cssVariableName ?? s.elementTypes.join(", ")}
                  </p>
                ))}
              </div>
            ))}
          </section>
        )}
      </div>
    </aside>
  );
}
export function StopInspector({
  palette,
  stop,
  onClose,
  onEdit,
  onLock,
  copy,
}: {
  palette: Palette;
  stop: PaletteStop;
  onClose: () => void;
  onEdit: (value: string) => void;
  onLock: () => void;
  copy: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(
    stop.color.inSrgbGamut ? stop.color.hex : stop.color.css,
  );
  const [error, setError] = useState("");
  function apply(event: React.FormEvent) {
    event.preventDefault();
    try {
      onEdit(value);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid color.");
    }
  }
  return (
    <aside className="inspector" aria-label="Palette stop inspector">
      <header>
        <h2>
          {paletteSlug(palette.name)}-{stop.step}
        </h2>
        <button
          className="icon-button button-text"
          onClick={onClose}
          title="Close inspector (Esc)"
          aria-label="Close inspector"
        >
          <X size={14} />
        </button>
      </header>
      <div
        className="inspector-preview"
        style={{ background: stop.color.css }}
      />
      <div className="stop-state">
        <span className="badge">
          {stop.source === "anchor" ? "Anchor" : "Generated"}
        </span>
        <button className="button-outline" onClick={onLock}>
          {stop.locked ? (
            <LockKeyhole size={14} />
          ) : (
            <LockKeyholeOpen size={14} />
          )}{" "}
          {stop.locked ? "Unlock" : "Lock"}
        </button>
      </div>
      <dl>
        <CopyValue label="HEX" value={stop.color.hex} copy={copy} />
        <CopyValue label="OKLCH" value={stop.color.css} copy={copy} />
        <CopyValue label="RGB" value={stop.color.rgb} copy={copy} />
        <dt>Origin</dt>
        <dd>
          {stop.source === "generated"
            ? "Generated in OKLCH"
            : stop.anchorOrigin === "manual"
              ? "Manual anchor"
              : "Website anchor"}
        </dd>
      </dl>
      <form className="stop-edit" onSubmit={apply}>
        <label className="field">
          Replace color
          <input
            aria-label="Stop color"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </label>
        <button className="primary">Apply color</button>
        <p className="muted">
          Editing makes this stop a locked anchor. Unlock it to allow
          regeneration.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </aside>
  );
}
