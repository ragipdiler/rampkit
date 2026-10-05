"use client";

import { useId, type RefObject } from "react";
import { CopyButton, CopyStatusIcon } from "./copy-button";
import { Command, Search, type LucideIcon } from "lucide-react";

export type CommandAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  keys?: string[];
  disabled?: boolean;
};

export function CommandPalette({
  dialogRef,
  query,
  onQueryChange,
  actions,
  activeIndex,
  onActiveIndexChange,
  onRun,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  query: string;
  onQueryChange: (query: string) => void;
  actions: CommandAction[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onRun: (label: string) => Promise<void> | void;
}) {
  const id = useId();
  const filtered = actions.filter((action) =>
    `${action.label} ${action.description}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );
  const firstEnabled = filtered.findIndex((action) => !action.disabled);
  const selected =
    filtered[activeIndex] && !filtered[activeIndex].disabled
      ? activeIndex
      : firstEnabled;
  function move(direction: 1 | -1) {
    if (!filtered.length) return;
    for (let offset = 1; offset <= filtered.length; offset++) {
      const next =
        (selected + direction * offset + filtered.length) % filtered.length;
      if (!filtered[next].disabled) {
        onActiveIndexChange(next);
        document
          .getElementById(`${id}-${next}`)
          ?.scrollIntoView({ block: "nearest" });
        return;
      }
    }
  }
  return (
    <dialog
      ref={dialogRef}
      className="command-dialog"
      aria-label="Command menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") event.stopPropagation();
      }}
    >
      <header className="command-search">
        <Search size={16} aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-label="Search commands"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-activedescendant={
            selected >= 0 ? `${id}-${selected}` : undefined
          }
          aria-autocomplete="list"
          value={query}
          placeholder="Search commands…"
          onChange={(event) => {
            onQueryChange(event.target.value);
            onActiveIndexChange(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              move(event.key === "ArrowDown" ? 1 : -1);
            }
            if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? firstEnabled
                  : filtered.reduce(
                      (last, action, index) => (action.disabled ? last : index),
                      -1,
                    );
              onActiveIndexChange(next);
              document
                .getElementById(`${id}-${next}`)
                ?.scrollIntoView({ block: "nearest" });
            }
            if (event.key === "Enter" && selected >= 0) {
              event.preventDefault();
              document.getElementById(`${id}-${selected}`)?.click();
            }
          }}
        />
        <span className="command-keys" aria-hidden="true">
          <kbd>
            <Command size={11} />
          </kbd>
          <kbd>K</kbd>
        </span>
      </header>
      <div
        id={`${id}-list`}
        role="listbox"
        aria-label="Commands"
        className="command-results"
      >
        {filtered.map((action, index) => {
          const Icon = action.icon;
          const content = (copied: boolean) => (
            <>
              <span className="command-icon">
                {action.label.startsWith("Copy ") ? (
                  <CopyStatusIcon copied={copied} size={16} />
                ) : (
                  <Icon size={16} aria-hidden="true" />
                )}
              </span>
              <span className="command-copy">
                <span className="command-title">{action.label}</span>
                <span className="command-description">
                  {action.description}
                </span>
              </span>
              {action.keys && (
                <span className="command-keys" aria-hidden="true">
                  {action.keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </span>
              )}
            </>
          );
          const buttonProps = {
            "aria-label": action.label,
            role: "option",
            id: `${id}-${index}`,
            className: "command-item",
            title: action.description,
            "aria-selected": index === selected,
            disabled: action.disabled,
            onPointerMove: () => {
              if (!action.disabled && index !== selected)
                onActiveIndexChange(index);
            },
            onFocus: () => onActiveIndexChange(index),
          };
          return action.label.startsWith("Copy ") ? (
            <CopyButton
              key={action.label}
              {...buttonProps}
              onCopy={() => onRun(action.label)}
            >
              {content}
            </CopyButton>
          ) : (
            <button
              type="button"
              key={action.label}
              {...buttonProps}
              onClick={() => void onRun(action.label)}
            >
              {content(false)}
            </button>
          );
        })}
        {!filtered.length && (
          <p className="command-empty" role="status">
            No commands found. Try “palette”, “color” or “export”.
          </p>
        )}
      </div>
      <footer className="command-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> Navigate
        </span>
        <span>
          <kbd>↵</kbd> Run
        </span>
        <span>
          <kbd>Esc</kbd> Close
        </span>
      </footer>
    </dialog>
  );
}
