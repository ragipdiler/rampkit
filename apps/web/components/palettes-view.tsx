"use client";
import { useId, useState } from "react";
import { SectionTabs, WorkspacePageActions } from "./section-tabs";
import { EmptyIllustration } from "./empty-illustration";
import { CopyButton } from "./copy-button";
import { Select, SelectOption } from "./select";
import { LockKeyhole, Plus, RotateCw, Pencil, Trash2 } from "lucide-react";
import type {
  Palette,
  GenerationSettings,
} from "../../../packages/core/src/models";
import { createIntegrationPrompt } from "../../../packages/tokens/src/integration";
import { buildTokenSystem } from "../../../packages/tokens/src/system";
import { paletteSlug } from "../../../packages/core/src/palettes";
export function PalettesView({
  palettes,
  onCreate,
  onCustom,
  onInspect,
  onAddAnchor,
  onRename,
  onDelete,
  onRegenerate,
  onSettings,
  onTokens,
  copy,
}: {
  palettes: Palette[];
  onCreate: () => void;
  onCustom: () => void;
  onInspect: (id: string, step: number) => void;
  onAddAnchor: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onSettings: (id: string, settings: GenerationSettings) => void;
  onTokens: () => void;
  copy: (text: string) => Promise<void>;
}) {
  const [section, setSection] = useState("scales");
  const id = useId();
  return (
    <>
      <div className="page-toolbar">
        <SectionTabs
          workspacePage="Palettes"
          id={id}
          label="Palette sections"
          value={section}
          onChange={setSection}
          items={[
            { value: "scales", label: "Scales" },
            { value: "generation", label: "Generation settings" },
          ]}
        />
      </div>
      {
        <WorkspacePageActions page="Palettes">
          <div className="inline-actions">
            <button className="button-outline" onClick={onCustom}>
              <Plus size={14} /> Add custom palette
            </button>
            {palettes.length > 0 && (
              <>
                <button className="button-outline" onClick={onTokens}>
                  Create tokens
                </button>
                <button className="primary" onClick={onCreate}>
                  <Plus size={14} /> Create Palette
                </button>
              </>
            )}
          </div>
        </WorkspacePageActions>
      }
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${section}`}
        tabIndex={0}
      >
        {!palettes.length && (
          <div className="palette-empty">
            <EmptyIllustration variant="palettes" />
            <h2>Build perceptually consistent color scales</h2>
            <p className="muted">
              Start with website colors or your own anchors.
              <br />
              Add an anchor, choose its position, and generate the rest.
            </p>
            <button className="primary" onClick={onCreate}>
              Create Palette
            </button>
          </div>
        )}
        {palettes.map((palette) => (
          <section
            className={`palette-block${palette.kind === "custom" ? " custom-palette" : ""}`}
            key={palette.id}
            aria-label={`${palette.name} palette`}
          >
            <header>
              <div>
                <h2>{palette.name}</h2>
                <p className="muted">
                  {palette.kind === "custom" ? (
                    `${palette.stops.length} colors · Custom palette`
                  ) : (
                    <>
                      {palette.stops.filter((s) => s.locked).length} locked ·{" "}
                      {
                        palette.stops.filter((s) => s.source === "generated")
                          .length
                      }{" "}
                      generated
                    </>
                  )}
                </p>
              </div>
              <div className="inline-actions">
                <CopyButton
                  className="button-outline"
                  aria-label={`Copy ${palette.name} for app`}
                  title="Copy a ready-to-paste integration prompt for Codex, Claude Code or VS Code"
                  onCopy={() =>
                    copy(
                      createIntegrationPrompt(buildTokenSystem([palette], [])),
                    )
                  }
                >
                  Copy for app
                </CopyButton>
                {palette.kind !== "custom" && (
                  <>
                    <button
                      className="button-outline"
                      onClick={() => onAddAnchor(palette.id)}
                    >
                      <Plus size={14} /> Add anchor
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => onRegenerate(palette.id)}
                      title="Regenerate unlocked stops"
                    >
                      <RotateCw size={14} /> Regenerate
                    </button>
                  </>
                )}
                <button
                  className="icon-button button-text"
                  onClick={() => onRename(palette.id)}
                  title="Rename palette"
                  aria-label={`Rename ${palette.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="icon-button button-danger"
                  onClick={() => onDelete(palette.id)}
                  title="Delete palette"
                  aria-label={`Delete ${palette.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </header>
            {section === "scales" && (
              <>
                <div className="palette-ramp">
                  {palette.stops.map((stop) => (
                    <button
                      className="ramp-stop"
                      key={stop.step}
                      onClick={() => onInspect(palette.id, stop.step)}
                      aria-label={`Inspect ${paletteSlug(palette.name)}-${stop.step}`}
                    >
                      <span
                        className="ramp-color"
                        style={{ background: stop.color.css }}
                      >
                        {stop.locked && (
                          <span className="lock-dot">
                            <LockKeyhole size={12} />
                          </span>
                        )}
                      </span>
                      <span className="ramp-label">{stop.step}</span>
                      <span className="ramp-value">{stop.color.hex}</span>
                      <span className="ramp-source">
                        {palette.kind === "custom"
                          ? "Manual"
                          : stop.source === "anchor"
                            ? "Anchor"
                            : "Generated"}
                      </span>
                    </button>
                  ))}
                </div>
                {palette.warnings.map((w) => (
                  <p className="error palette-warning" key={w}>
                    {w}
                  </p>
                ))}
                <div className="anchor-summary">
                  {palette.anchors.map((anchor) => (
                    <button
                      key={anchor.step}
                      className="text-button"
                      onClick={() => onInspect(palette.id, anchor.step)}
                    >
                      {anchor.locked && <LockKeyhole size={12} />} {anchor.step}{" "}
                      → {anchor.color.hex}
                    </button>
                  ))}
                </div>
              </>
            )}
            {section === "generation" && palette.kind === "custom" && (
              <p className="muted">
                Custom palettes preserve your colors and do not use generation
                settings.
              </p>
            )}
            {section === "generation" && palette.kind !== "custom" && (
              <div className="advanced-generation">
                <div className="settings-row">
                  <label>
                    Lightness curve
                    <Select
                      aria-label={`${palette.name} lightness curve`}
                      value={palette.settings.lightness}
                      onValueChange={(value) =>
                        onSettings(palette.id, {
                          ...palette.settings,
                          lightness: value as GenerationSettings["lightness"],
                        })
                      }
                    >
                      <SelectOption value="balanced">Balanced</SelectOption>
                      <SelectOption value="soft">Soft</SelectOption>
                    </Select>
                  </label>
                  <label>
                    Chroma behavior
                    <Select
                      aria-label={`${palette.name} chroma behavior`}
                      value={palette.settings.chroma}
                      onValueChange={(value) =>
                        onSettings(palette.id, {
                          ...palette.settings,
                          chroma: value as GenerationSettings["chroma"],
                        })
                      }
                    >
                      <SelectOption value="auto">Auto</SelectOption>
                      <SelectOption value="muted">Muted</SelectOption>
                    </Select>
                  </label>
                  <label>
                    Hue behavior
                    <Select
                      aria-label={`${palette.name} hue behavior`}
                      value={palette.settings.hue}
                      onValueChange={(value) =>
                        onSettings(palette.id, {
                          ...palette.settings,
                          hue: value as GenerationSettings["hue"],
                        })
                      }
                    >
                      <SelectOption value="preserve">
                        Preserve identity
                      </SelectOption>
                      <SelectOption value="blend">Blend anchors</SelectOption>
                    </Select>
                  </label>
                  <span className="muted">
                    Apply with Regenerate. Locked values stay exact.
                  </span>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
