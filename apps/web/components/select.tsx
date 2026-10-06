"use client";

import {
  useRef,
  useState,
  useEffect,
  useId,
  Children,
  isValidElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

const EMPTY_VALUE = "__rampkit_unresolved__";

/** Shared select, including its open menu. Portals stay inside native dialogs. */
export function Select({
  value,
  onValueChange,
  children,
  disabled,
  required,
  name,
  searchable,
  ...label
}: {
  value: string | number;
  onValueChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  searchable?: boolean;
  "aria-label"?: string;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [container, setContainer] = useState<HTMLElement | undefined>();
  if (searchable)
    return (
      <SearchableSelect
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
        name={name}
        label={label["aria-label"]}
      >
        {children}
      </SearchableSelect>
    );
  return (
    <SelectPrimitive.Root
      value={String(value) || EMPTY_VALUE}
      onValueChange={(next) => onValueChange(next === EMPTY_VALUE ? "" : next)}
      onOpenChange={(open) => {
        if (open) setContainer(trigger.current?.closest("dialog") ?? undefined);
      }}
      disabled={disabled}
      required={required}
      name={name}
    >
      <SelectPrimitive.Trigger
        ref={trigger}
        className="select-trigger"
        data-value={String(value)}
        {...label}
      >
        <SelectPrimitive.Value />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={container}>
        <SelectPrimitive.Content
          className="select-menu"
          position="popper"
          sideOffset={8}
          collisionPadding={8}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <SelectPrimitive.ScrollUpButton className="select-scroll">
            <ChevronUp size={14} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="select-options">
            {children}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="select-scroll">
            <ChevronDown size={14} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function SelectOption({
  value,
  children,
  disabled,
}: {
  value?: string | number;
  children: string | number;
  disabled?: boolean;
}) {
  const actual = String(value ?? children);
  return (
    <SelectPrimitive.Item
      className="select-option"
      value={actual || EMPTY_VALUE}
      data-value={actual}
      disabled={disabled}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="select-check">
        <Check size={14} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SearchableSelect({
  value,
  onValueChange,
  children,
  disabled,
  required,
  name,
  label,
}: {
  value: string | number;
  onValueChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  label?: string;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const anchorPosition = useRef({ top: 0, left: 0 });
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState({
    left: 0,
    top: 0,
    width: 200,
    maxHeight: 280,
  });
  const options = Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        value?: string | number;
        children: string | number;
        disabled?: boolean;
      }>(child)
    )
      return [];
    return [
      {
        value: String(child.props.value ?? child.props.children),
        label: String(child.props.children),
        disabled: child.props.disabled,
      },
    ];
  });
  const matches = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const enabled = matches.filter((option) => !option.disabled);
  const selected = options.find((option) => option.value === String(value));
  const current = enabled[Math.min(active, Math.max(0, enabled.length - 1))];
  const activeId = current
    ? `${id}-option-${options.findIndex((o) => o.value === current.value)}`
    : undefined;
  const close = (restore = true) => {
    setOpen(false);
    if (restore) trigger.current?.focus();
  };
  const choose = (next: string) => {
    onValueChange(next);
    close();
  };
  function show() {
    setPortalContainer(trigger.current?.closest("dialog") ?? document.body);
    const rect = trigger.current!.getBoundingClientRect();
    anchorPosition.current = { top: rect.top, left: rect.left };
    const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 16);
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const height = Math.min(280, Math.max(below, above));
    setPlacement({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      top:
        below >= Math.min(280, above)
          ? rect.bottom + 8
          : Math.max(8, rect.top - height - 8),
      width,
      maxHeight: height,
    });
    setQuery("");
    setActive(0);
    setOpen(true);
  }
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (
        !menu.current?.contains(event.target as Node) &&
        !trigger.current?.contains(event.target as Node)
      )
        setOpen(false);
    }
    function viewportChange(event: Event) {
      if (event.target instanceof Node && menu.current?.contains(event.target))
        return;
      const rect = trigger.current?.getBoundingClientRect();
      // A different scroll pane must not dismiss this anchored menu.
      if (
        event.type === "resize" ||
        !rect ||
        Math.abs(rect.top - anchorPosition.current.top) > 1 ||
        Math.abs(rect.left - anchorPosition.current.left) > 1
      )
        setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", viewportChange);
    window.addEventListener("scroll", viewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", viewportChange);
      window.removeEventListener("scroll", viewportChange, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open || !activeId) return;
    const option = document.getElementById(activeId);
    const list = option?.closest<HTMLElement>(".searchable-options");
    if (!option || !list) return;
    const item = option.getBoundingClientRect();
    const viewport = list.getBoundingClientRect();
    if (item.top < viewport.top) list.scrollTop += item.top - viewport.top;
    else if (item.bottom > viewport.bottom)
      list.scrollTop += item.bottom - viewport.bottom;
  }, [open, activeId]);
  const popup = open ? (
    <div
      ref={menu}
      className="select-menu searchable-select"
      style={{ position: "fixed", ...placement }}
    >
      <input
        autoFocus
        className="select-search"
        aria-label={`Search ${label ?? "colors"}`}
        role="combobox"
        aria-expanded="true"
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={
          current
            ? `${id}-option-${options.findIndex((o) => o.value === current.value)}`
            : undefined
        }
        placeholder="Search colors…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setActive((previous) =>
              enabled.length
                ? (previous +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    enabled.length) %
                  enabled.length
                : 0,
            );
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (current) choose(current.value);
          } else if (event.key === "Tab") close(false);
        }}
      />
      <div
        className="searchable-options"
        role="listbox"
        id={`${id}-list`}
        aria-label={label ?? "Colors"}
      >
        {matches.map((option) => (
          <button
            type="button"
            role="option"
            id={`${id}-option-${options.findIndex((o) => o.value === option.value)}`}
            key={option.value}
            className="select-option"
            aria-selected={option.value === String(value)}
            data-state={
              option.value === String(value) ? "checked" : "unchecked"
            }
            data-active={option === current ? "true" : undefined}
            disabled={option.disabled}
            tabIndex={-1}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => choose(option.value)}
          >
            <span>{option.label}</span>
            {option.value === String(value) && (
              <Check size={14} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
      {!matches.length && (
        <p className="select-empty" role="status">
          No colors found.
        </p>
      )}
    </div>
  ) : null;
  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        ref={trigger}
        className="select-trigger"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-haspopup="listbox"
        aria-required={required}
        data-value={String(value)}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            show();
          }
        }}
      >
        {selected?.label ?? String(value)}
      </button>
      {popup && portalContainer && createPortal(popup, portalContainer)}
    </>
  );
}
