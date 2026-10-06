"use client";
import { useId, useState } from "react";
import { IntegrationPanel } from "./integration-panel";
import { TokenPreview } from "./token-preview";
import { SectionTabs, WorkspacePageActions } from "./section-tabs";
import { EmptyIllustration } from "./empty-illustration";
import { Select, SelectOption } from "./select";
import type { TokenSystem } from "../../../packages/tokens/src/system";
import type { Theme } from "../../../packages/core/src/models";
const GROUPS = [
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "border", label: "Border" },
  { key: "action-primary", label: "Primary button" },
  { key: "action-secondary", label: "Secondary button" },
  { key: "success", label: "Success" },
  { key: "warning", label: "Warning" },
  { key: "danger", label: "Danger" },
  { key: "info", label: "Info" },
];
const groupOf = (name: string) =>
  name.startsWith("action-")
    ? name.split("-").slice(0, 2).join("-")
    : name.split("-")[0];
const categoryOf = (key: string) =>
  key.startsWith("action-")
    ? "action"
    : ["success", "warning", "danger", "info"].includes(key)
      ? "status"
      : key;

export function TokensView({
  system,
  created,
  theme,
  onCreate,
  onSuggest,
  onMap,
  copy,
}: {
  system: TokenSystem;
  created: boolean;
  theme: Theme;
  copy: (text: string) => Promise<void>;
  onCreate: () => void;
  onSuggest: () => void;
  onMap: (name: string, value: string) => void;
}) {
  const sectionId = useId();
  const groupId = useId();
  const [section, setSection] = useState("semantic");
  const [category, setCategory] = useState("all");
  const semantics = system.semantics.filter((t) => t.theme === theme);
  return (
    <>
      {!created ? (
        <div className="source-empty">
          <EmptyIllustration variant="tokens" />
          <h2>
            {system.palettes?.length
              ? "Your palettes are ready"
              : "Create a palette first"}
          </h2>
          <p className="muted">
            Create tokens to map your system and preview your colors on
            dashboard components.
          </p>
          {!!system.palettes?.length && (
            <button className="primary" onClick={onCreate}>
              Create tokens
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="page-toolbar">
            <SectionTabs
              workspacePage="Tokens"
              id={sectionId}
              label="Token sections"
              value={section}
              onChange={setSection}
              items={[
                {
                  value: "semantic",
                  label: "Semantic",
                  count: semantics.length,
                },
                {
                  value: "primitive",
                  label: "Primitives",
                  count: system.primitives.length,
                },
                { value: "preview", label: "Preview" },
                { value: "integrate", label: "Integrate" },
              ]}
            />
          </div>
          {section === "semantic" && (
            <WorkspacePageActions page="Tokens">
              <button className="button-outline" onClick={onSuggest}>
                Use suggested mappings
              </button>
            </WorkspacePageActions>
          )}
          <div
            id={`${sectionId}-panel`}
            role="tabpanel"
            aria-labelledby={`${sectionId}-${section}`}
            tabIndex={0}
          >
            {section === "semantic" ? (
              <>
                <p className="muted mapping-note">
                  Choose primitive references for {theme}. Suggestions are
                  applied only when you choose them.
                </p>
                <SectionTabs
                  id={groupId}
                  label="Semantic groups"
                  value={category}
                  onChange={setCategory}
                  items={[
                    { value: "all", label: "All" },
                    ...[
                      "background",
                      "surface",
                      "text",
                      "border",
                      "action",
                      "status",
                    ].map((key) => ({
                      value: key,
                      label: key[0].toUpperCase() + key.slice(1),
                    })),
                  ].map((item) => ({
                    ...item,
                    count: semantics.filter(
                      (t) =>
                        item.value === "all" ||
                        categoryOf(groupOf(t.name)) === item.value,
                    ).length,
                  }))}
                />
                <div
                  id={`${groupId}-panel`}
                  role="tabpanel"
                  aria-labelledby={`${groupId}-${category}`}
                  tabIndex={0}
                  className="semantic-groups"
                >
                  {GROUPS.filter(
                    (group) =>
                      category === "all" || categoryOf(group.key) === category,
                  ).map((group) => {
                    const tokens = semantics.filter(
                      (t) => groupOf(t.name) === group.key,
                    );
                    if (!tokens.length) return null;
                    const resolved = tokens.filter((t) =>
                      system.primitives.some(
                        (p) => p.name === t.primitiveToken,
                      ),
                    ).length;
                    return (
                      <section
                        className="semantic-group"
                        aria-label={`${group.label} tokens`}
                        key={group.key}
                      >
                        <div className="semantic-group-heading">
                          <h2>{group.label}</h2>
                          <span className="muted">
                            {resolved}/{tokens.length} mapped
                          </span>
                        </div>
                        {tokens.map((token) => {
                          const primitive = system.primitives.find(
                            (t) => t.name === token.primitiveToken,
                          );
                          const shortName =
                            token.name === group.key
                              ? "Default"
                              : token.name.slice(group.key.length + 1);
                          return (
                            <div className="semantic-row" key={token.name}>
                              <span
                                className="semantic-name"
                                title={token.name}
                              >
                                {shortName}
                              </span>
                              <Select
                                searchable
                                aria-label={`Map ${token.name}`}
                                value={primitive?.name ?? ""}
                                onValueChange={(value) =>
                                  onMap(token.name, value)
                                }
                              >
                                <SelectOption value="">Unresolved</SelectOption>
                                {system.primitives.map((t) => (
                                  <SelectOption value={t.name} key={t.name}>
                                    {t.name}
                                  </SelectOption>
                                ))}
                              </Select>
                              <span
                                className="semantic-value"
                                title={primitive?.color.css ?? "Unresolved"}
                              >
                                {primitive ? (
                                  <>
                                    <span
                                      className="swatch"
                                      style={{
                                        background: primitive.color.css,
                                      }}
                                    />
                                    {primitive.color.hex}
                                  </>
                                ) : (
                                  <span className="muted">Unresolved</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </section>
                    );
                  })}
                </div>
              </>
            ) : section === "integrate" ? (
              <IntegrationPanel system={system} copy={copy} />
            ) : section === "preview" ? (
              <TokenPreview
                system={system}
                theme={theme}
                onEdit={() => setSection("semantic")}
                onMap={onMap}
              />
            ) : (
              <>
                <div className="primitive-grid">
                  {system.primitives.map((t) => (
                    <div className="primitive-item" key={t.name}>
                      <span
                        className="swatch"
                        style={{ background: t.color.css }}
                      />
                      <span>{t.name}</span>
                      <span className="muted">{t.color.hex}</span>
                      <span className="badge">
                        {t.source === "generated" ? "Generated" : "Anchor"}
                        {t.locked ? " · locked" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
