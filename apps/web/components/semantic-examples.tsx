"use client";
import type { CSSProperties } from "react";
import { CheckCircle2, AlertTriangle, CircleAlert, Info } from "lucide-react";
import type { Theme } from "../../../packages/core/src/models";
import type { TokenSystem } from "../../../packages/tokens/src/system";

const EXAMPLES = [
  {
    title: "Backgrounds",
    roles: [
      "background-primary",
      "background-secondary",
      "background-tertiary",
    ],
  },
  { title: "Surfaces", roles: ["surface-primary", "surface-secondary"] },
  {
    title: "Typography",
    roles: ["text-primary", "text-secondary", "text-tertiary", "text-inverse"],
  },
  {
    title: "Borders and focus",
    roles: ["border-primary", "border-secondary", "border-focus"],
  },
  ...["primary", "secondary"].map((kind) => ({
    title: `${kind === "primary" ? "Primary" : "Secondary"} button`,
    roles: [
      `action-${kind}`,
      `action-${kind}-hover`,
      `action-${kind}-active`,
      `action-${kind}-foreground`,
    ],
  })),
  ...["success", "warning", "danger", "info"].map((kind) => ({
    title: `${kind[0].toUpperCase() + kind.slice(1)} notification`,
    roles: [kind, `${kind}-foreground`],
  })),
];
const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: CircleAlert,
  info: Info,
};
const MESSAGES = {
  success: "Your changes are saved.",
  warning: "Some changes need your review.",
  danger: "This action could not be completed.",
  info: "A new update is available.",
};

/** Each specimen uses only explicitly mapped values; missing roles are shown honestly. */
export function SemanticExamples({
  system,
  theme,
}: {
  system: TokenSystem;
  theme: Theme;
}) {
  const tokenFor = (role: string) =>
    system.primitives.find(
      (primitive) =>
        primitive.name ===
        system.semantics.find(
          (semantic) => semantic.theme === theme && semantic.name === role,
        )?.primitiveToken,
    );
  const color = (role: string) => tokenFor(role)?.color.css;
  return (
    <section
      className="semantic-examples"
      aria-label="All semantic token examples"
    >
      {EXAMPLES.map((example, index) => {
        const missing = example.roles.filter((role) => !tokenFor(role));
        const kind = example.roles[0];
        const specimenColor = (role: string) =>
          missing.length ? undefined : color(role);
        const style = Object.fromEntries(
          example.roles.map((role) => [`--sample-${role}`, color(role)]),
        ) as CSSProperties;
        return (
          <article
            className="semantic-example"
            key={example.title}
            aria-label={example.title}
            data-token-group={
              index === 0
                ? "background"
                : index === 1
                  ? "surface"
                  : index === 2
                    ? "text"
                    : index === 3
                      ? "border"
                      : kind
            }
            style={style}
            data-mapped={missing.length === 0}
          >
            <h3>{example.title}</h3>
            {index <= 1 ? (
              <div className="sample-layers">
                {example.roles.map((role) => (
                  <div
                    key={role}
                    style={{
                      background: specimenColor(role),
                      color: specimenColor("text-primary"),
                    }}
                  >
                    <span
                      style={{
                        background: specimenColor("surface-primary"),
                        color: specimenColor("text-primary"),
                      }}
                    >
                      {role}
                    </span>
                  </div>
                ))}
              </div>
            ) : index === 2 ? (
              <div className="sample-type">
                {example.roles.map((role) => (
                  <p
                    key={role}
                    style={{
                      color: specimenColor(role),
                      background:
                        role === "text-inverse"
                          ? specimenColor("action-primary")
                          : specimenColor("surface-primary"),
                    }}
                  >
                    {role}: The quick brown fox
                  </p>
                ))}
              </div>
            ) : index === 3 ? (
              <div className="sample-borders">
                {example.roles.map((role) => (
                  <div
                    key={role}
                    style={{
                      border: `1px solid ${specimenColor(role)}`,
                      background: specimenColor("surface-primary"),
                      color: specimenColor("text-primary"),
                    }}
                  >
                    {role === "border-focus" ? "Focused field" : role}
                  </div>
                ))}
              </div>
            ) : index <= 5 ? (
              <div className="sample-button-states">
                {["Default", "Hover", "Pressed"].map((state, i) => (
                  <button
                    type="button"
                    key={state}
                    className="sample-button"
                    style={{
                      background: specimenColor(example.roles[i]),
                      color: specimenColor(example.roles[3]),
                    }}
                  >
                    {state}
                  </button>
                ))}
              </div>
            ) : (
              (() => {
                const status = kind as keyof typeof ICONS;
                const Icon = ICONS[status];
                return (
                  <div
                    className="sample-notification"
                    style={{
                      background: specimenColor(kind),
                      color: specimenColor(`${kind}-foreground`),
                    }}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <div>
                      <strong>
                        {example.title.replace(" notification", "")}
                      </strong>
                      <p>{MESSAGES[status]}</p>
                    </div>
                  </div>
                );
              })()
            )}
            {missing.length > 0 && (
              <p className="muted sample-unmapped">
                Unmapped: {missing.join(", ")}. Neutral placeholder only.
              </p>
            )}
            <div className="sample-references">
              {example.roles.map((role) => (
                <div key={role}>
                  <span
                    className="swatch"
                    style={{ background: color(role) }}
                  />
                  <span>
                    {role}
                    <small>{tokenFor(role)?.name ?? "Unresolved"}</small>
                  </span>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
