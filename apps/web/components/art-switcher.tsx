"use client";
import { Paintbrush } from "lucide-react";

export function ArtSwitcher({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="header-theme">
      <button
        type="button"
        role="switch"
        aria-label="Art theme"
        aria-checked={enabled}
        className="art-switcher"
        onClick={() => onChange(!enabled)}
      >
        <Paintbrush size={14} aria-hidden="true" />
        <span>Art theme</span>
        <span className="art-switch-track" aria-hidden="true">
          <span />
        </span>
      </button>
    </div>
  );
}
