"use client";
import { CopyButton } from "../../web/components/copy-button";

export const INSTALL_COMMAND =
  "git clone https://github.com/ragipdiler/rampkit.git\ncd rampkit\nnpm install\nnpx playwright install chromium";

export function InstallCommand() {
  return (
    <div className="install-stack">
      <div className="install-box">
        <div className="install-box-top">
          <span>
            <span className="terminal-dot" />
            01 — Install Rampkit
          </span>
          <CopyButton
            className="copy-install"
            aria-label="Copy installation commands"
            onCopy={() => navigator.clipboard.writeText(INSTALL_COMMAND)}
          >
            Copy commands
          </CopyButton>
        </div>
        <pre>
          <code>{INSTALL_COMMAND}</code>
        </pre>
      </div>
      <div className="install-box">
        <div className="install-box-top">
          <span>
            <span className="terminal-dot" />
            02 — Start the app
          </span>
          <CopyButton
            className="copy-install"
            aria-label="Copy launch command"
            onCopy={() => navigator.clipboard.writeText("npm run dev")}
          >
            Copy command
          </CopyButton>
        </div>
        <pre>
          <code>npm run dev</code>
        </pre>
        <div className="install-box-bottom">
          <span className="ready-dot" />
          <span>
            Then open <strong>localhost:3000</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
