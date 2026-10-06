"use client";
import { EmptyIllustration } from "./empty-illustration";
import { SectionTabs } from "./section-tabs";
import { useId, useState } from "react";
import { Check } from "lucide-react";
import type {
  SourceAnalysis,
  SourceColor,
} from "../../../packages/core/src/models";
export function SourceView({
  analysis,
  sources,
  selected,
  ignored,
  onSelect,
  onCreate,
  onSuggest,
  onRestore,
}: {
  analysis: SourceAnalysis | null;
  sources: SourceColor[];
  selected: string[];
  ignored: string[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onSuggest: (name: string, ids: string[]) => void;
  onRestore: (id: string) => void;
}) {
  const [section, setSection] = useState("colors");
  const id = useId();
  const active = sources.filter((s) => !ignored.includes(s.id));
  const visible = sources.filter(
    (s) =>
      !ignored.includes(s.id) &&
      (section === "candidates" ? !s.curated : s.curated),
  );
  return (
    <>
      <SectionTabs
        workspacePage="Source"
        id={id}
        label="Source sections"
        value={section}
        onChange={setSection}
        items={[
          {
            value: "colors",
            label: "Colors",
            count: active.filter((s) => s.curated).length,
          },
          {
            value: "candidates",
            label: "Candidates",
            count: active.filter((s) => !s.curated).length,
          },
          {
            value: "suggestions",
            label: "Potential palettes",
            count: analysis?.suggestions.length ?? 0,
          },
          { value: "ignored", label: "Ignored", count: ignored.length },
          {
            value: "notes",
            label: "Notes",
            count: analysis?.warnings.length ?? 0,
          },
        ]}
      />
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${section}`}
        tabIndex={0}
      >
        {(section === "colors" || section === "candidates") && (
          <>
            {sources.length > 0 && (
              <div className="source-actions">
                <span className="muted">
                  {selected.length
                    ? `${selected.length} selected`
                    : "Select swatches to inspect or build a palette."}
                </span>
                <button
                  className={selected.length ? "primary" : "button-secondary"}
                  disabled={!selected.length}
                  onClick={onCreate}
                >
                  {selected.length > 1
                    ? "Create palettes from selection"
                    : "Create palette from selection"}
                </button>
              </div>
            )}
            {!sources.length && section === "colors" && (
              <div className="source-empty">
                <EmptyIllustration variant="source" />
                <h2>Start with a color</h2>
                <p className="muted">
                  Analyze a website above, or use Add color in the top bar for a
                  HEX, RGB, or OKLCH color.
                </p>
              </div>
            )}
            <div className="source-grid" aria-label="Source colors">
              {visible.map((source) => {
                const variants = source.variants.filter(
                  (v) => v.alpha < 1,
                ).length;
                return (
                  <button
                    key={source.id}
                    className="source-swatch"
                    aria-label={`Select ${source.color.hex}`}
                    aria-pressed={selected.includes(source.id)}
                    onClick={() => onSelect(source.id)}
                  >
                    <span
                      className="source-color"
                      style={{ background: source.color.css }}
                    >
                      {selected.includes(source.id) && (
                        <span className="swatch-check">
                          <Check size={14} />
                        </span>
                      )}
                    </span>
                    <span className="source-caption">
                      <strong>{source.color.hex}</strong>
                      <span>
                        {source.origin === "manual"
                          ? "Manual"
                          : `${source.variants.reduce((n, v) => n + v.usageCount, 0)} uses`}
                        {variants ? ` · ${variants} alpha variants` : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {section === "candidates" && !visible.length && (
              <p className="muted">No lower-value candidates.</p>
            )}
            {section === "candidates" && (
              <p className="muted">
                Lower-value candidates are kept separately. Opacity variants and
                near duplicates are grouped; original evidence is available in
                the inspector.
              </p>
            )}
            {section === "colors" && sources.length > 0 && !visible.length && (
              <p className="muted">
                No active curated colors. Check Candidates or restore an ignored
                color.
              </p>
            )}
          </>
        )}
        {section === "suggestions" && (
          <section aria-label="Potential palettes">
            <p className="muted">
              Suggestions only. A palette is created only when you choose Create
              palette.
            </p>
            {analysis?.suggestions.length ? (
              <div className="suggestions">
                {analysis.suggestions.map((s) => (
                  <div className="suggestion-row" key={s.name}>
                    <div>
                      <h2>Potential {s.name}</h2>
                      <div className="mini-swatches">
                        {s.sourceIds.map((id) => {
                          const source = sources.find((s) => s.id === id);
                          return source ? (
                            <span
                              key={id}
                              className="swatch"
                              style={{ background: source.color.css }}
                              title={source.color.hex}
                            />
                          ) : null;
                        })}
                        <span className="muted">
                          {Math.round(s.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <button
                      className="button-outline"
                      onClick={() => onSuggest(s.name, s.sourceIds)}
                    >
                      Create palette
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                Analyze a website to find potential palettes.
              </p>
            )}
          </section>
        )}
        {section === "ignored" && (
          <section className="ignored-sources" aria-label="Ignored colors">
            {!ignored.length && (
              <p className="muted">
                No ignored colors. Ignored colors remain available here to
                restore.
              </p>
            )}
            {sources
              .filter((s) => ignored.includes(s.id))
              .map((s) => (
                <div className="suggestion-row" key={s.id}>
                  <span>{s.color.hex}</span>
                  <button
                    className="button-text"
                    onClick={() => onRestore(s.id)}
                  >
                    Restore
                  </button>
                </div>
              ))}
          </section>
        )}
        {section === "notes" && (
          <section aria-label="Extraction notes">
            {analysis?.warnings.length ? (
              analysis.warnings.map((note) => (
                <p key={note} className="muted">
                  {note}
                </p>
              ))
            ) : (
              <p className="muted">
                No extraction notes. Any analysis limitations will appear here.
              </p>
            )}
          </section>
        )}
      </div>
    </>
  );
}
