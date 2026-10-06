"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, Check, MoreHorizontal, Plus } from "lucide-react";
import { SemanticExamples } from "./semantic-examples";
import { SEMANTIC_NAMES } from "../../../packages/tokens/src/semantic";
import { SectionTabs } from "./section-tabs";
import { Select, SelectOption } from "./select";
import { contrastRatio } from "../../../packages/core/src/contrast";
import type { Theme } from "../../../packages/core/src/models";
import type { TokenSystem } from "../../../packages/tokens/src/system";

const ROLES = [
  "background-primary",
  "surface-primary",
  "text-primary",
  "text-secondary",
  "border-primary",
  "action-primary",
  "action-primary-foreground",
] as const;
type Role = (typeof ROLES)[number];
const MAPPING_GROUPS = [
  { prefix: "background", label: "Background" },
  { prefix: "surface", label: "Surface" },
  { prefix: "text", label: "Text" },
  { prefix: "border", label: "Border and focus" },
  { prefix: "action-primary", label: "Primary button" },
  { prefix: "action-secondary", label: "Secondary button" },
  { prefix: "success", label: "Success" },
  { prefix: "warning", label: "Warning" },
  { prefix: "danger", label: "Danger" },
  { prefix: "info", label: "Info" },
];

/** Palette studies are temporary; semantic edits use the shared saved mappings. */
export function TokenPreview({
  system,
  theme,
  onEdit,
  onMap,
}: {
  system: TokenSystem;
  theme: Theme;
  onEdit: () => void;
  onMap: (name: string, value: string) => void;
}) {
  const modeId = useId();
  const previewStage = useRef<HTMLElement>(null);
  const [mode, setMode] = useState("semantic");
  const families = [...new Set(system.primitives.map((token) => token.family))];
  const [family, setFamily] = useState(families[0] ?? "");
  const selectedFamily = families.includes(family) ? family : families[0];
  const [invited, setInvited] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [project, setProject] = useState("Color study");
  const steps: Record<Role, number> =
    theme === "light"
      ? {
          "background-primary": 50,
          "surface-primary": 25,
          "text-primary": 950,
          "text-secondary": 700,
          "border-primary": 200,
          "action-primary": 600,
          "action-primary-foreground": 25,
        }
      : {
          "background-primary": 950,
          "surface-primary": 900,
          "text-primary": 25,
          "text-secondary": 200,
          "border-primary": 700,
          "action-primary": 300,
          "action-primary-foreground": 950,
        };
  const assignments = ROLES.map((role) => {
    const reference =
      mode === "palette"
        ? system.primitives.find(
            (token) =>
              token.family === selectedFamily && token.step === steps[role],
          )?.name
        : system.semantics.find(
            (token) => token.theme === theme && token.name === role,
          )?.primitiveToken;
    return {
      role,
      token: system.primitives.find((token) => token.name === reference),
    };
  });
  const unresolved = assignments.filter((assignment) => !assignment.token);
  const color = (role: Role) =>
    assignments.find((assignment) => assignment.role === role)!.token!.color;
  const style = unresolved.length
    ? undefined
    : (Object.fromEntries(
        ROLES.map((role) => [`--preview-${role}`, color(role).css]),
      ) as CSSProperties);
  const foregroundRatio = unresolved.length
    ? null
    : contrastRatio(
        color("text-primary"),
        color("surface-primary"),
        color("background-primary"),
      );
  const actionRatio = unresolved.length
    ? null
    : contrastRatio(
        color("action-primary-foreground"),
        color("action-primary"),
        color("background-primary"),
      );
  function mapAndReveal(role: string, value: string, group: string) {
    onMap(role, value);
    if (ROLES.includes(role as Role)) return;
    requestAnimationFrame(() => {
      const pane = previewStage.current;
      const example = pane?.querySelector<HTMLElement>(
        `[data-token-group="${group}"]`,
      );
      if (!pane || !example || pane.scrollHeight <= pane.clientHeight) return;
      pane.scrollTo({
        top:
          pane.scrollTop +
          example.getBoundingClientRect().top -
          pane.getBoundingClientRect().top -
          8,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });
  }
  return (
    <div className="token-preview">
      <div className="preview-controls">
        <SectionTabs
          id={modeId}
          label="Preview color source"
          value={mode}
          onChange={setMode}
          items={[
            { value: "semantic", label: "Semantic mappings" },
            { value: "palette", label: "Palette study" },
          ]}
        />
        {mode === "palette" && (
          <label>
            Palette{" "}
            <Select
              searchable
              aria-label="Preview palette"
              value={selectedFamily ?? ""}
              onValueChange={setFamily}
            >
              {families.map((name) => (
                <SelectOption key={name} value={name}>
                  {name}
                </SelectOption>
              ))}
            </Select>
          </label>
        )}
        <span className="muted">
          {theme === "light" ? "Light" : "Dark"} preview
        </span>
      </div>
      <div
        className={`preview-layout${mode === "semantic" ? " is-semantic" : ""}`}
        id={`${modeId}-panel`}
        role="tabpanel"
        aria-labelledby={`${modeId}-${mode}`}
        tabIndex={0}
      >
        {mode === "semantic" && (
          <section
            className="preview-mapping-editor"
            aria-label="Preview semantic mappings"
            tabIndex={0}
          >
            <div className="preview-editor-heading">
              <h2>Token mappings</h2>
              <button className="button-text" onClick={onEdit}>
                All semantic mappings
              </button>
            </div>
            <p className="muted preview-note">
              Changes apply to {theme} mappings and exports.
            </p>
            {MAPPING_GROUPS.map((group) => {
              const roles = SEMANTIC_NAMES.filter(
                (role) =>
                  role === group.prefix || role.startsWith(`${group.prefix}-`),
              );
              return (
                <section
                  className="preview-token-group"
                  key={group.prefix}
                  aria-label={`${group.label} preview tokens`}
                >
                  <h3>{group.label}</h3>
                  <div className="preview-mapping-grid">
                    {roles.map((role) => {
                      const reference = system.semantics.find(
                        (semantic) =>
                          semantic.theme === theme && semantic.name === role,
                      )?.primitiveToken;
                      const token = system.primitives.find(
                        (primitive) => primitive.name === reference,
                      );
                      return (
                        <label className="preview-mapping" key={role}>
                          <span title={role}>
                            {role === group.prefix
                              ? "Default"
                              : role.slice(group.prefix.length + 1)}
                          </span>
                          <Select
                            searchable
                            aria-label={`Preview map ${role}`}
                            value={token?.name ?? ""}
                            onValueChange={(value) =>
                              mapAndReveal(role, value, group.prefix)
                            }
                          >
                            <SelectOption value="">Unresolved</SelectOption>
                            {system.primitives.map((primitive) => (
                              <SelectOption
                                value={primitive.name}
                                key={primitive.name}
                              >
                                {primitive.name}
                              </SelectOption>
                            ))}
                          </Select>
                          <span
                            className="preview-mapping-value"
                            title={
                              token
                                ? `${token.name} · ${token.source === "generated" ? "Generated" : "Anchor"}`
                                : "Unresolved"
                            }
                          >
                            {token ? (
                              <>
                                <span
                                  className="swatch"
                                  style={{ background: token.color.css }}
                                />
                                {token.color.hex}
                              </>
                            ) : (
                              "Unresolved"
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </section>
        )}
        <section
          ref={previewStage}
          className="preview-stage"
          aria-label="Live token preview"
          tabIndex={0}
        >
          <div className="preview-stage-heading">
            <h2>Live preview</h2>
            <span className="muted">
              {mode === "semantic"
                ? "Saved mappings"
                : "Temporary palette study"}
            </span>
          </div>
          {mode === "palette" && (
            <p className="muted preview-note">
              Sample interactions only. These study roles do not change your
              saved mappings.
            </p>
          )}
          {unresolved.length ? (
            <div className="preview-unresolved">
              <h2>Map colors to preview your dashboard</h2>
              <p className="muted">
                Missing:{" "}
                {unresolved.map((assignment) => assignment.role).join(", ")}.
                Choose references in Token mappings, or switch to Palette study
                to explore your colors without changing mappings.
              </p>
            </div>
          ) : (
            <>
              <section
                className="preview-dashboard"
                aria-label="Dashboard token preview"
                style={style}
              >
                <header className="preview-dashboard-header">
                  <div>
                    <span className="preview-eyebrow">SAMPLE WORKSPACE</span>
                    <h2>Studio overview</h2>
                  </div>
                  <span className="preview-avatar" title="Sample avatar">
                    RK
                  </span>
                </header>
                <div className="preview-stat-grid">
                  {[
                    { label: "Projects", value: "12", detail: "3 in progress" },
                    {
                      label: "Collaborators",
                      value: invited ? "9" : "8",
                      detail: "Working together",
                    },
                    { label: "Completion", value: "76%", detail: "This month" },
                  ].map((stat) => (
                    <article className="preview-card" key={stat.label}>
                      <span className="preview-secondary">{stat.label}</span>
                      <strong className="preview-number">{stat.value}</strong>
                      <span className="preview-secondary">
                        <ArrowUpRight size={12} aria-hidden="true" />
                        {stat.detail}
                      </span>
                    </article>
                  ))}
                </div>
                <div className="preview-detail-grid">
                  <article className="preview-card">
                    <div className="preview-card-heading">
                      <h3>Project activity</h3>
                      <MoreHorizontal size={16} aria-hidden="true" />
                    </div>
                    <div
                      className="preview-chart"
                      role="img"
                      aria-label="Sample weekly activity chart; illustrative values"
                    >
                      {[32, 56, 44, 80, 64, 92, 72].map((height, index) => (
                        <div key={index}>
                          <span style={{ height: `${height}%` }} />
                          <small>
                            {["M", "T", "W", "T", "F", "S", "S"][index]}
                          </small>
                        </div>
                      ))}
                    </div>
                    <div className="preview-progress">
                      <span style={{ width: "76%" }} />
                    </div>
                    <span className="preview-secondary">
                      76% of the sample goal
                    </span>
                  </article>
                  <article className="preview-card">
                    <h3>Project settings</h3>
                    <label className="preview-field">
                      Project name
                      <input
                        aria-label="Sample project name"
                        value={project}
                        onChange={(event) => setProject(event.target.value)}
                      />
                    </label>
                    <label className="preview-check">
                      <input
                        type="checkbox"
                        checked={notifications}
                        onChange={(event) =>
                          setNotifications(event.target.checked)
                        }
                      />
                      Email notifications
                    </label>
                    <div className="preview-button-row">
                      <button
                        type="button"
                        className="preview-action"
                        onClick={() => setInvited(!invited)}
                      >
                        {invited ? <Check size={14} /> : <Plus size={14} />}
                        {invited ? "Invited" : "Invite member"}
                      </button>
                      <button
                        type="button"
                        className="preview-outline"
                        onClick={() => {
                          setProject("Color study");
                          setNotifications(true);
                          setInvited(false);
                        }}
                      >
                        Reset demo
                      </button>
                    </div>
                    <p className="preview-secondary" role="status">
                      {invited
                        ? "Sample invitation added. No invitation was sent."
                        : "Try the controls to see your colors in use."}
                    </p>
                  </article>
                </div>
              </section>
              <div
                className="preview-contrast"
                aria-label="Preview contrast checks"
              >
                {[
                  { label: "Card text", ratio: foregroundRatio! },
                  { label: "Action text", ratio: actionRatio! },
                ].map((check) => (
                  <span key={check.label}>
                    {check.label}: {check.ratio.toFixed(2)}:1 ·{" "}
                    {check.ratio >= 4.5 ? "AA pass" : "AA fail"}
                  </span>
                ))}
              </div>
              {mode === "palette" && (
                <div
                  className="preview-reference-grid"
                  aria-label="Preview token references"
                >
                  {assignments.map(({ role, token }) => (
                    <div key={role}>
                      <span
                        className="swatch"
                        style={{ background: token!.color.css }}
                      />
                      <div>
                        <span>{role}</span>
                        <small>
                          {token!.name} · {token!.color.hex} ·{" "}
                          {token!.source === "generated"
                            ? "Generated"
                            : "Anchor"}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {mode === "semantic" && (
            <SemanticExamples system={system} theme={theme} />
          )}
        </section>
      </div>
    </div>
  );
}
