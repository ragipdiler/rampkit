"use client";
import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const WorkspaceTabsContext = createContext<{
  target: HTMLDivElement | null;
  page: string;
  actionsTarget: HTMLDivElement | null;
} | null>(null);

export function SectionTabs({
  id,
  label,
  value,
  onChange,
  items,
  workspacePage,
}: {
  workspacePage?: string;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string; count?: number }[];
}) {
  const workspace = useContext(WorkspaceTabsContext);
  if (workspacePage && workspace && workspace.page !== workspacePage)
    return null;
  const tabs = (
    <div className="section-tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.value}
          id={`${id}-${item.value}`}
          role="tab"
          aria-selected={value === item.value}
          aria-controls={`${id}-panel`}
          tabIndex={value === item.value ? 0 : -1}
          onClick={() => onChange(item.value)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % items.length;
            else if (event.key === "ArrowLeft")
              next = (index - 1 + items.length) % items.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = items.length - 1;
            else return;
            event.preventDefault();
            onChange(items[next].value);
            document.getElementById(`${id}-${items[next].value}`)?.focus();
          }}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="tab-count">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
  return workspacePage && workspace?.target
    ? createPortal(tabs, workspace.target)
    : tabs;
}

export function WorkspacePageActions({
  page,
  children,
}: {
  page: string;
  children: ReactNode;
}) {
  const workspace = useContext(WorkspaceTabsContext);
  if (workspace && workspace.page !== page) return null;
  return workspace?.actionsTarget ? (
    createPortal(children, workspace.actionsTarget)
  ) : (
    <div className="page-toolbar">{children}</div>
  );
}
