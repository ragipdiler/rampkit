"use client";
import { EmptyIllustration } from "./empty-illustration";
import { Select, SelectOption } from "./select";
import { useState } from "react";
import type { Theme } from "../../../packages/core/src/models";
import type { TokenSystem } from "../../../packages/tokens/src/system";
import {
  contrastRatio,
  contrastChecks,
} from "../../../packages/core/src/contrast";
export function ContrastView({
  system,
  theme,
}: {
  system: TokenSystem;
  theme: Theme;
}) {
  const [foreground, setForeground] = useState("");
  const [background, setBackground] = useState("");
  const fg =
      system.primitives.find((t) => t.name === foreground) ??
      system.primitives[0],
    bg =
      system.primitives.find((t) => t.name === background) ??
      system.primitives.at(-1);
  const ratio =
    fg && bg
      ? contrastRatio(fg.color, bg.color, theme === "dark" ? "#000" : "#fff")
      : null;
  const checks = ratio === null ? null : contrastChecks(ratio);
  return (
    <>
      {!fg || !bg ? (
        <div className="source-empty">
          <EmptyIllustration variant="contrast" />
          <h2>Check your color pairings</h2>
          <p className="muted">Create primitive tokens to validate contrast.</p>
        </div>
      ) : (
        <>
          <div className="contrast-picker">
            <label>
              Foreground
              <Select
                searchable
                aria-label="Contrast foreground"
                value={fg.name}
                onValueChange={(value) => setForeground(value)}
              >
                {system.primitives.map((t) => (
                  <SelectOption key={t.name}>{t.name}</SelectOption>
                ))}
              </Select>
            </label>
            <label>
              Background
              <Select
                searchable
                aria-label="Contrast background"
                value={bg.name}
                onValueChange={(value) => setBackground(value)}
              >
                {system.primitives.map((t) => (
                  <SelectOption key={t.name}>{t.name}</SelectOption>
                ))}
              </Select>
            </label>
            <strong data-testid="custom-contrast-ratio">
              {ratio!.toFixed(2)}:1
            </strong>
          </div>
          <div
            className="contrast-sample"
            style={{ background: bg.color.css, color: fg.color.css }}
          >
            The quick brown fox jumps over the lazy dog.
          </div>
          <div className="contrast-criteria">
            {Object.entries(checks!).map(([name, pass]) => (
              <span key={name}>
                {
                  (
                    {
                      aaNormal: "AA normal",
                      aaLarge: "AA large",
                      aaaNormal: "AAA normal",
                      aaaLarge: "AAA large",
                      ui: "UI",
                    } as Record<string, string>
                  )[name]
                }{" "}
                · {pass ? "Pass" : "Fail"}
              </span>
            ))}
          </div>
        </>
      )}
      <section
        className={
          !fg || !bg
            ? "semantic-relationships semantic-relationships-empty"
            : "semantic-relationships"
        }
        aria-label="Semantic relationships"
      >
        <h2 className="section-title">Semantic relationships</h2>
        {system.contrast.filter((c) => c.theme === theme).length ? (
          <table>
            <thead>
              <tr>
                <th>Pair / criterion</th>
                <th>Ratio</th>
                <th>AA</th>
                <th>AAA</th>
                <th>AA large</th>
                <th>AAA large</th>
                <th>UI</th>
                <th>Suggestion</th>
              </tr>
            </thead>
            <tbody>
              {system.contrast
                .filter((c) => c.theme === theme)
                .map((c) => (
                  <tr key={`${c.foreground}/${c.background}`}>
                    <td>
                      {c.foreground} / {c.background}
                      <p className="muted">
                        {c.criterion} · {c.foregroundToken} /{" "}
                        {c.backgroundToken}
                      </p>
                    </td>
                    <td className={c.pass ? "" : "error"}>
                      {c.ratio.toFixed(2)}:1 · {c.pass ? "Pass" : "Fail"}
                    </td>
                    {[
                      c.checks.aaNormal,
                      c.checks.aaaNormal,
                      c.checks.aaLarge,
                      c.checks.aaaLarge,
                      c.checks.ui,
                    ].map((pass, i) => (
                      <td key={i}>{pass ? "Pass" : "Fail"}</td>
                    ))}
                    <td>
                      {c.suggestion
                        ? `${c.suggestion.token} · ${c.suggestion.ratio.toFixed(2)}:1 · Pass`
                        : c.pass
                          ? "—"
                          : "No suitable token"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">
            Map foreground and background semantic tokens to validate their
            relationships. The custom pair check works without semantic
            mappings.
          </p>
        )}
        <p className="muted mapping-note">
          Normal text: AA 4.5:1 · AAA 7:1. Large text: AA 3:1 · AAA 4.5:1. UI
          3:1. Suggestions never change your anchors or mappings.
        </p>
      </section>
    </>
  );
}
