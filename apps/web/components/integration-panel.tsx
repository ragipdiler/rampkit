"use client";
import { useId, useState } from "react";
import { CopyButton } from "./copy-button";
import { SectionTabs } from "./section-tabs";
import { Select, SelectOption } from "./select";
import type { TokenSystem } from "../../../packages/tokens/src/system";
import {
  createIntegrationPrompt,
  integrationSystem,
  type IntegrationTarget,
  type IntegrationFormat,
} from "../../../packages/tokens/src/integration";

export function IntegrationPanel({
  system,
  copy,
}: {
  system: TokenSystem;
  copy: (text: string) => Promise<void>;
}) {
  const id = useId();
  const [target, setTarget] = useState<IntegrationTarget>("codex");
  const [format, setFormat] = useState<IntegrationFormat>("css");
  const [scope, setScope] = useState("all");
  if (!system.primitives.length)
    return (
      <p className="muted">
        Create a palette to prepare an integration prompt.
      </p>
    );
  const paletteId =
    scope !== "all" && system.palettes?.some((p) => p.id === scope)
      ? scope
      : undefined;
  const report = integrationSystem(system, paletteId);
  const prompt = createIntegrationPrompt(system, { target, format, paletteId });
  const mapped = report.semantics.filter((t) => t.primitiveToken).length;
  return (
    <section className="integration-panel" aria-label="App integration">
      <div className="integration-controls">
        <SectionTabs
          id={id}
          label="Coding assistant"
          value={target}
          onChange={(value) => setTarget(value as IntegrationTarget)}
          items={[
            { value: "codex", label: "Codex" },
            { value: "claude", label: "Claude Code" },
            { value: "vscode", label: "VS Code" },
          ]}
        />
        <CopyButton className="primary" onCopy={() => copy(prompt)}>
          Copy integration prompt
        </CopyButton>
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${target}`}
        tabIndex={0}
      >
        <div className="integration-options">
          <label>
            Colors{" "}
            <Select
              searchable
              aria-label="Integration colors"
              value={paletteId ?? "all"}
              onValueChange={setScope}
            >
              <SelectOption value="all">
                All palettes &amp; semantic mappings
              </SelectOption>
              {system.palettes?.map((p) => (
                <SelectOption key={p.id} value={p.id}>
                  {`${p.name} palette only`}
                </SelectOption>
              ))}
            </Select>
          </label>
          <label>
            Format{" "}
            <Select
              aria-label="Integration format"
              value={format}
              onValueChange={(value) => setFormat(value as IntegrationFormat)}
            >
              <SelectOption value="css">CSS variables</SelectOption>
              <SelectOption value="tailwind">Tailwind CSS v4</SelectOption>
            </Select>
          </label>
        </div>
        <p className="muted integration-note">
          Paste into your coding assistant with the application project open.
          Review its changes before applying them. Copying does not modify
          another application.
        </p>
        <p className="muted integration-note">
          {report.primitives.length} primitives · {mapped}/
          {report.semantics.length} semantic mappings across Light/Dark.{" "}
          {report.semantics.length
            ? "Unresolved roles keep the application's existing colors."
            : "Palette only: the assistant will propose color roles."}
        </p>
        <textarea
          className="integration-code"
          aria-label="Integration prompt"
          value={prompt}
          readOnly
          spellCheck={false}
        />
      </div>
    </section>
  );
}
