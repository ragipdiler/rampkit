"use client";
import { EmptyIllustration } from "./empty-illustration";
import Image from "next/image";
import { CommandPalette, type CommandAction } from "./command-palette";
import { ArtSwitcher } from "./art-switcher";
import { WorkspaceTabsContext } from "./section-tabs";
import { ThemeSwitcher } from "./theme-switcher";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Palette as PaletteIcon,
  SwatchBook,
  Braces,
  Contrast,
  Download,
  Plus,
  Globe,
  Copy,
  SunMoon,
  PanelsTopLeft,
} from "lucide-react";
import type {
  SourceAnalysis,
  SourceColor,
  Palette,
  Theme,
  SemanticToken,
} from "../../../packages/core/src/models";
import { STEPS } from "../../../packages/core/src/models";
import { manualSource } from "../../../packages/core/src/sources";
import {
  createPalette,
  editPaletteStop,
  toggleStopLock,
  regeneratePalette,
  paletteSlug,
} from "../../../packages/core/src/palettes";
import {
  blankSemantics,
  buildTokenSystem,
} from "../../../packages/tokens/src/system";
import { generateSemantics } from "../../../packages/tokens/src/semantic";
import { exportTokens } from "../../../packages/tokens/src/export";
import { SourceView } from "./source-view";
import { PalettesView } from "./palettes-view";
import { ColorCanvas } from "./color-canvas";
import { TokensView } from "./tokens-view";
import { ContrastView } from "./contrast-view";
import { websiteUrl } from "../lib/website-url";
import { PaletteCollectionDialog } from "./palette-collection-dialog";
import { BuilderDialog, type BuilderDialogSpec } from "./builder-dialog";
import { SourceInspector, StopInspector } from "./builder-inspector";
import { ExportPanel } from "./export-panel";
const tabs = [
  "Source",
  "Palettes",
  "Tokens",
  "Contrast",
  "Export",
  "Canvas",
] as const;
type Tab = (typeof tabs)[number];
type Inspection =
  | { kind: "source"; id: string }
  | { kind: "stop"; id: string; step: number }
  | null;
const icons = [
  SwatchBook,
  PaletteIcon,
  Braces,
  Contrast,
  Download,
  PanelsTopLeft,
];
export function Workbench() {
  const [tab, setTab] = useState<Tab>("Palettes");
  const [art, setArt] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.uiTheme = art ? "art" : "classic";
    return () => {
      delete document.documentElement.dataset.uiTheme;
    };
  }, [art]);
  const [url, setUrl] = useState("https://");
  const [analysis, setAnalysis] = useState<SourceAnalysis | null>(null);
  const [manual, setManual] = useState<SourceColor[]>([]);
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [inspection, setInspection] = useState<Inspection>(null);
  const [tabsTarget, setTabsTarget] = useState<HTMLDivElement | null>(null);
  const [actionsTarget, setActionsTarget] = useState<HTMLDivElement | null>(
    null,
  );
  const [collection, setCollection] = useState<{
    sources?: SourceColor[];
  } | null>(null);
  const [sheet, setSheet] = useState<BuilderDialogSpec | null>(null);
  const [created, setCreated] = useState(false);
  const [mappings, setMappings] = useState<SemanticToken[]>(blankSemantics);
  const [theme, setTheme] = useState<Theme>("light");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [commandQuery, setCommandQuery] = useState("");
  const [commandIndex, setCommandIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const urlForm = useRef<HTMLFormElement>(null);
  const commands = useRef<HTMLDialogElement>(null);
  const abort = useRef<AbortController | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sources = [...manual, ...(analysis?.sources ?? [])];
  const system = buildTokenSystem(created ? palettes : [], mappings);
  const previewSystem = { ...system, palettes };
  const inspectSource =
    inspection?.kind === "source"
      ? sources.find((s) => s.id === inspection.id)
      : undefined;
  const inspectPalette =
    inspection?.kind === "stop"
      ? palettes.find((p) => p.id === inspection.id)
      : undefined;
  const inspectStop =
    inspection?.kind === "stop"
      ? inspectPalette?.stops.find((s) => s.step === inspection.step)
      : undefined;
  const notify = useCallback((message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(""), 2400);
  }, []);
  const copy = useCallback(async (value: string) => {
    await navigator.clipboard.writeText(value);
  }, []);
  function replacePalette(palette: Palette) {
    setPalettes((previous) =>
      previous.map((p) => (p.id === palette.id ? palette : p)),
    );
  }
  function attempt(action: () => void) {
    try {
      action();
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not apply this change.",
      );
    }
  }
  function openCreate(ids = selected, name = "") {
    setSheet({
      kind: "palette",
      name,
      existingNames: palettes.map((palette) => palette.name),
      sources: sources.filter((s) => ids.includes(s.id)).slice(0, 12),
    });
  }
  const openCommands = useCallback(() => {
    setCommandQuery("");
    setCommandIndex(0);
    commands.current?.showModal();
  }, []);
  const analyze = useCallback(async () => {
    if (loading) return;
    const targetUrl = websiteUrl(url);
    setUrl(targetUrl);
    setLoading(true);
    setStage("Loading page…");
    setError("");
    setTab("Source");
    const controller = new AbortController();
    abort.current = controller;
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Analysis failed.");
      }
      if (!response.body) throw new Error("No analysis response was received.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "",
        received = false;
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "progress") setStage(event.stage);
          if (event.type === "error") throw new Error(event.error);
          if (event.type === "result") {
            setAnalysis(event.report);
            setSelected([]);
            setInspection(null);
            received = true;
          }
        }
        if (done) break;
      }
      if (!received)
        throw new Error("Analysis ended before source colors were available.");
    } catch (err) {
      if (!controller.signal.aborted)
        setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
      setStage("");
      abort.current = null;
    }
  }, [loading, url]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setInspection(null);
        commands.current?.close();
        return;
      }
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === "l") {
        event.preventDefault();
        setTab((current) => (current === "Canvas" ? "Source" : current));
        requestAnimationFrame(() => {
          input.current?.focus();
          input.current?.select();
        });
      }
      if (key === "k") {
        event.preventDefault();
        openCommands();
      }
      if (key === "e") {
        event.preventDefault();
        setTab("Export");
      }
      if (/^[1-6]$/.test(key)) {
        event.preventDefault();
        setTab(tabs[Number(key) - 1]);
        setInspection(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openCommands]);
  useEffect(
    () => () => {
      abort.current?.abort();
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );
  function submitSheet(data: {
    name: string;
    anchors: Parameters<typeof createPalette>[1];
    value: string;
  }) {
    if (!sheet) return;
    if (sheet.kind === "manual") {
      const source = manualSource(data.value);
      setManual((previous) => [
        source,
        ...previous.filter((s) => s.id !== source.id),
      ]);
      setIgnored((previous) => previous.filter((id) => id !== source.id));
      setSelected([source.id]);
      setInspection({ kind: "source", id: source.id });
      setTab("Source");
      notify("Color added");
    }
    if (sheet.kind === "palette") {
      const slug = paletteSlug(data.name);
      if (palettes.some((p) => paletteSlug(p.name) === slug))
        throw new Error("Choose a unique palette name.");
      const palette = createPalette(
        data.name,
        data.anchors,
        crypto.randomUUID(),
      );
      setPalettes((previous) => [...previous, palette]);
      setTab("Palettes");
      setInspection(null);
      notify("Palette created. Anchors preserved.");
    }
    if (sheet.kind === "anchor") {
      const palette = palettes.find((p) => p.id === sheet.paletteId)!;
      const anchor = data.anchors[0];
      replacePalette(
        editPaletteStop(
          palette,
          anchor.step,
          anchor.color.css,
          anchor.origin,
          anchor.sourceColorId,
        ),
      );
      notify("Anchor added. Regenerate to rebuild unlocked stops.");
    }
    if (sheet.kind === "rename") {
      const palette = palettes.find((p) => p.id === sheet.paletteId)!;
      const slug = paletteSlug(data.name);
      if (
        palettes.some(
          (p) => p.id !== palette.id && paletteSlug(p.name) === slug,
        )
      )
        throw new Error("Choose a unique palette name.");
      const aliases = new Map(
        palette.stops.map((s) => [
          `${paletteSlug(palette.name)}-${s.step}`,
          `${slug}-${s.step}`,
        ]),
      );
      setMappings((previous) =>
        previous.map((t) =>
          t.primitiveToken && aliases.has(t.primitiveToken)
            ? { ...t, primitiveToken: aliases.get(t.primitiveToken)! }
            : t,
        ),
      );
      replacePalette({ ...palette, name: data.name.trim() });
      notify("Palette renamed");
    }
    setSheet(null);
    setError("");
  }
  function createTokens() {
    setCreated(true);
    setTab("Tokens");
    notify("Primitive tokens created from your palettes");
  }
  const commandActions: CommandAction[] = [
    {
      label: "Create Palette",
      description: "Build an OKLCH scale around the colors you choose.",
      icon: PaletteIcon,
    },
    {
      label: "Add color",
      description: "Add a source color using HEX, RGB or OKLCH.",
      icon: Plus,
    },
    {
      label: "Analyze website",
      description: "Enter or edit a URL in the analysis bar.",
      icon: Globe,
      disabled: loading,
    },
    ...tabs.map((name, index) => ({
      label: `Open ${name}`,
      description: {
        Source: "Inspect and select your source colors.",
        Palettes: "Build, edit and regenerate your color scales.",
        Tokens: "Create primitives and map Light/Dark semantics.",
        Contrast: "Check foreground and background accessibility.",
        Export: "Copy or download your color system.",
        Canvas: "Paint, blend and collect colors on an infinite canvas.",
      }[name],
      icon: icons[index],
      keys: ["⌘", String(index + 1)],
    })),
    {
      label: "Copy current palette",
      description: "Copy the selected or first palette as HEX values.",
      icon: Copy,
      disabled: !palettes.length,
    },
    {
      label: "Copy CSS variables",
      description: "Copy primitives and Light/Dark semantic references.",
      icon: Copy,
      disabled: !created,
    },
    {
      label: "Copy OKLCH values",
      description: "Copy all palette stops as precise OKLCH values.",
      icon: Copy,
      disabled: !palettes.length,
    },
    {
      label: "Toggle Light / Dark preview",
      description: "Switch the token theme and open its mappings.",
      icon: SunMoon,
      disabled: !created,
    },
  ];
  async function runCommand(name: string) {
    if (!name.startsWith("Copy ")) commands.current?.close();
    if (name === "Create Palette") openCreate();
    if (name === "Add color") setSheet({ kind: "manual" });
    if (name === "Analyze website") {
      if (tab === "Canvas") setTab("Source");
      requestAnimationFrame(() => {
        input.current?.focus();
        input.current?.select();
      });
    }
    const target = tabs.find((t) => name === `Open ${t}`);
    if (target) {
      setTab(target);
      if (target === "Canvas") setInspection(null);
    }
    if (name === "Toggle Light / Dark preview") {
      setTheme(theme === "light" ? "dark" : "light");
      setTab("Tokens");
    }
    if (name === "Copy CSS variables" && created)
      await copy(exportTokens(system, "css"));
    if (name === "Copy OKLCH values")
      await copy(
        palettes
          .flatMap((p) =>
            p.stops.map(
              (s) => `${paletteSlug(p.name)}-${s.step}: ${s.color.css}`,
            ),
          )
          .join("\n"),
      );
    if (name === "Copy current palette")
      await copy(
        (inspectPalette ?? palettes[0])?.stops
          .map((s) => s.color.hex)
          .join("\n") ?? "",
      );
  }
  return (
    <WorkspaceTabsContext.Provider
      value={{ target: tabsTarget, actionsTarget, page: tab }}
    >
      <header className="toolbar">
        <span className="wordmark">
          <Image src="/brand/rampkit-mark.svg" alt="" width={20} height={20} />
          Rampkit
        </span>
        <nav className="top-navigation" aria-label="Workspace">
          {tabs.map((name, index) => {
            const Icon = icons[index];
            return (
              <button
                key={name}
                aria-label={name}
                aria-current={tab === name ? "page" : undefined}
                onClick={() => {
                  setTab(name);
                  setInspection(null);
                }}
              >
                <Icon size={15} />
                {name}
              </button>
            );
          })}
        </nav>
        <div className="top-navigation-end">
          <ArtSwitcher enabled={art} onChange={setArt} />
          <a
            className="profile-link"
            href="https://github.com/ragipdiler"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile: /ragipdiler (opens in a new tab)"
          >
            <Image
              src="/brand/github-invertocat.svg"
              alt=""
              width={16}
              height={16}
            />
            <span>/ragipdiler</span>
          </a>
        </div>
      </header>
      <div className="builder-layout">
        <div className="workspace-column">
          <div
            className={`builder-main${tab === "Canvas" ? " canvas-main" : ""}`}
          >
            <div className="workspace-meta">
              <div className="workspace-heading">
                <h1>{tab}</h1>
              </div>
              <div className="workspace-tabs-slot" ref={setTabsTarget} />
              {(["Tokens", "Contrast", "Export"] as Tab[]).includes(tab) && (
                <div className="token-theme">
                  <span>Token theme</span>
                  <ThemeSwitcher theme={theme} onChange={setTheme} />
                </div>
              )}
              <div
                className="workspace-actions"
                role="group"
                aria-label="Workspace actions"
              >
                <div
                  className="workspace-page-actions"
                  ref={setActionsTarget}
                />
                <button
                  className="button-secondary"
                  onClick={() => setSheet({ kind: "manual" })}
                >
                  <Plus size={14} /> Add color
                </button>
              </div>
            </div>
            <span role="status" className="workspace-feedback">
              {feedback}
            </span>
            {loading && (
              <div className="status" role="status">
                {stage}
              </div>
            )}
            {error && (
              <div className="status error" role="alert">
                {error}
              </div>
            )}
            <main
              className={`view${tab === "Canvas" ? " canvas-view" : ""}`}
              aria-label={`${tab} workspace`}
            >
              <div hidden={tab !== "Canvas"} className="canvas-mount">
                <ColorCanvas
                  sources={sources}
                  palettes={palettes}
                  tokens={system.primitives}
                  onDiscover={(colors, gradient) => {
                    setSheet({
                      kind: "palette",
                      sources: colors.map(manualSource),
                      existingNames: palettes.map((p) => p.name),
                      ...(gradient
                        ? {
                            steps: colors.map(
                              (_, i) =>
                                STEPS[
                                  Math.round(
                                    (i * 11) / Math.max(1, colors.length - 1),
                                  )
                                ],
                            ),
                          }
                        : {}),
                    });
                  }}
                />
              </div>
              {tab === "Source" && (
                <SourceView
                  analysis={analysis}
                  sources={sources}
                  selected={selected}
                  ignored={ignored}
                  onSelect={(id) => {
                    setSelected((previous) =>
                      previous.includes(id)
                        ? previous.filter((s) => s !== id)
                        : [...previous, id],
                    );
                    setInspection({ kind: "source", id });
                  }}
                  onCreate={() => {
                    const chosen = sources.filter((source) =>
                      selected.includes(source.id),
                    );
                    if (chosen.length > 1) setCollection({ sources: chosen });
                    else openCreate();
                  }}
                  onSuggest={(name, ids) => openCreate(ids, name)}
                  onRestore={(id) =>
                    setIgnored((previous) => previous.filter((s) => s !== id))
                  }
                />
              )}
              {tab === "Palettes" && (
                <PalettesView
                  copy={copy}
                  palettes={palettes}
                  onCreate={() => openCreate([], "")}
                  onCustom={() => setCollection({})}
                  onInspect={(id, step) =>
                    setInspection({ kind: "stop", id, step })
                  }
                  onAddAnchor={(id) =>
                    setSheet({
                      kind: "anchor",
                      paletteId: id,
                      sources: sources
                        .filter((s) => selected.includes(s.id))
                        .slice(0, 1),
                    })
                  }
                  onRename={(id) =>
                    setSheet({
                      kind: "rename",
                      paletteId: id,
                      name: palettes.find((p) => p.id === id)!.name,
                    })
                  }
                  onDelete={(id) => {
                    const palette = palettes.find((p) => p.id === id)!;
                    const names = new Set(
                      palette.stops.map(
                        (s) => `${paletteSlug(palette.name)}-${s.step}`,
                      ),
                    );
                    setMappings((previous) =>
                      previous.map((t) =>
                        t.primitiveToken && names.has(t.primitiveToken)
                          ? { ...t, primitiveToken: null }
                          : t,
                      ),
                    );
                    setPalettes((previous) =>
                      previous.filter((p) => p.id !== id),
                    );
                    setInspection(null);
                    notify("Palette deleted");
                  }}
                  onRegenerate={(id) =>
                    attempt(() => {
                      replacePalette(
                        regeneratePalette(palettes.find((p) => p.id === id)!),
                      );
                      notify("Unlocked stops regenerated");
                    })
                  }
                  onSettings={(id, settings) =>
                    replacePalette({
                      ...palettes.find((p) => p.id === id)!,
                      settings,
                    })
                  }
                  onTokens={createTokens}
                />
              )}
              {tab === "Tokens" && (
                <TokensView
                  copy={copy}
                  system={previewSystem}
                  created={created}
                  theme={theme}
                  onCreate={createTokens}
                  onSuggest={() => {
                    setMappings(generateSemantics(system.primitives));
                    notify("Suggested mappings applied. Review both themes.");
                  }}
                  onMap={(name, value) =>
                    setMappings((previous) =>
                      previous.map((t) =>
                        t.name === name && t.theme === theme
                          ? { ...t, primitiveToken: value || null }
                          : t,
                      ),
                    )
                  }
                />
              )}
              {tab === "Contrast" && (
                <ContrastView system={system} theme={theme} />
              )}
              {tab === "Export" &&
                (created && system.primitives.length ? (
                  <ExportPanel report={system} copy={copy} />
                ) : (
                  <>
                    <div className="source-empty">
                      <EmptyIllustration variant="export" />
                      <h2>Create tokens from your palettes first</h2>
                      <p className="muted">
                        Only your chosen palettes are included in the final
                        system.
                      </p>
                      <button
                        className="primary"
                        disabled={!palettes.length}
                        onClick={createTokens}
                      >
                        Create tokens
                      </button>
                    </div>
                  </>
                ))}
            </main>
          </div>
          <form
            className="url-form floating-analysis"
            style={tab === "Canvas" ? { display: "none" } : undefined}
            aria-label="Website analysis"
            ref={urlForm}
            onSubmit={(e) => {
              e.preventDefault();
              void analyze();
            }}
          >
            <div className="url-field">
              <input
                ref={input}
                aria-label="Website URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a website URL"
                title="Optional: analyze a website to find source colors"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                onBlur={() =>
                  setUrl((value) => websiteUrl(value) || "https://")
                }
                onPaste={(event) => {
                  const pasted = event.clipboardData.getData("text").trim();
                  if (/^https?:\/\//i.test(pasted)) {
                    event.preventDefault();
                    setUrl(pasted);
                  }
                }}
                required
                disabled={loading}
              />
              <button className="primary" disabled={loading}>
                {loading ? "Analyzing…" : "Analyze"}
              </button>
            </div>
            {loading && (
              <button
                className="button-text"
                type="button"
                onClick={() => abort.current?.abort()}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
        {inspectSource && (
          <SourceInspector
            source={inspectSource}
            onClose={() => setInspection(null)}
            onIgnore={() => {
              setIgnored((previous) => [
                ...new Set([...previous, inspectSource.id]),
              ]);
              setSelected((previous) =>
                previous.filter((id) => id !== inspectSource.id),
              );
              setInspection(null);
            }}
            onCreate={() => openCreate([inspectSource.id])}
            copy={copy}
          />
        )}
        {inspectPalette && inspectStop && (
          <StopInspector
            key={`${inspectPalette.id}-${inspectStop.step}-${inspectStop.color.id}`}
            palette={inspectPalette}
            stop={inspectStop}
            onClose={() => setInspection(null)}
            onEdit={(value) => {
              replacePalette(
                editPaletteStop(inspectPalette, inspectStop.step, value),
              );
              notify("Color updated and locked as an anchor");
            }}
            onLock={() =>
              replacePalette(toggleStopLock(inspectPalette, inspectStop.step))
            }
            copy={copy}
          />
        )}
      </div>
      {collection && (
        <PaletteCollectionDialog
          sources={collection.sources}
          existingNames={palettes.map((palette) => palette.name)}
          onClose={() => setCollection(null)}
          onSubmit={(created) => {
            setPalettes((previous) => [...previous, ...created]);
            setCollection(null);
            setSelected([]);
            setInspection(null);
            setTab("Palettes");
            notify(
              `${created.length} palette${created.length === 1 ? "" : "s"} created.`,
            );
          }}
        />
      )}
      {sheet && (
        <BuilderDialog
          spec={sheet}
          onClose={() => setSheet(null)}
          onSubmit={submitSheet}
        />
      )}
      <CommandPalette
        dialogRef={commands}
        query={commandQuery}
        onQueryChange={setCommandQuery}
        actions={commandActions}
        activeIndex={commandIndex}
        onActiveIndexChange={setCommandIndex}
        onRun={runCommand}
      />
    </WorkspaceTabsContext.Provider>
  );
}
