"use client";
import { Sun, Moon } from "lucide-react";
import type { Theme } from "../../../packages/core/src/models";

export function ThemeSwitcher({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (theme: Theme) => void;
}) {
  return (
    <div
      className="theme-switcher"
      role="radiogroup"
      aria-label="Token preview"
      data-value={theme}
      onKeyDown={(event) => {
        if (
          ![
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
          ].includes(event.key)
        )
          return;
        event.preventDefault();
        const next: Theme =
          event.key === "Home"
            ? "light"
            : event.key === "End"
              ? "dark"
              : theme === "light"
                ? "dark"
                : "light";
        onChange(next);
        event.currentTarget
          .querySelector<HTMLButtonElement>(`[data-theme="${next}"]`)
          ?.focus();
      }}
    >
      <span className="theme-switcher-thumb" aria-hidden="true" />
      {(["light", "dark"] as const).map((value) => {
        const Icon = value === "light" ? Sun : Moon;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-label={value === "light" ? "Light" : "Dark"}
            aria-checked={theme === value}
            tabIndex={theme === value ? 0 : -1}
            data-theme={value}
            onClick={() => onChange(value)}
          >
            <Icon size={14} aria-hidden="true" />
            <span>{value === "light" ? "Light" : "Dark"}</span>
          </button>
        );
      })}
    </div>
  );
}
