"use client";
import { CopyButton } from "../../web/components/copy-button";

export const INSTALL_COMMAND =
  "git clone https://github.com/ragipdiler/rampkit.git\ncd rampkit\nnpm ci\nnpx playwright install chromium";

export function InstallCommand() {
  return (
    <div className="install-stack">
      <div className="install-box terminal-window">
        <TerminalTitle label="Terminal — setup" />
        <div className="terminal-body">
          <div className="install-box-top">
            <span>01 — Download and install</span>
            <CopyButton
              className="copy-install"
              aria-label="Copy installation commands"
              onCopy={() => navigator.clipboard.writeText(INSTALL_COMMAND)}
            >
              Copy commands
            </CopyButton>
          </div>
          <p className="install-help">
            Open a terminal in the folder where you want to download Rampkit.
            Run these lines in order; stop if a command fails.
          </p>
          <TerminalCommands
            command={INSTALL_COMMAND}
            label="Installation commands"
          />
        </div>
      </div>
      <div className="install-box terminal-window">
        <TerminalTitle label="Terminal — rampkit" />
        <div className="terminal-body">
          <div className="install-box-top">
            <span>02 — Start from the rampkit folder</span>
            <CopyButton
              className="copy-install"
              aria-label="Copy launch command"
              onCopy={() => navigator.clipboard.writeText("npm run dev")}
            >
              Copy command
            </CopyButton>
          </div>
          <p className="install-help">
            Continue in the same terminal after setup. For later sessions, open
            a terminal in the downloaded <code>rampkit</code> folder first.
          </p>
          <TerminalCommands
            command="npm run dev"
            label="Launch command"
            cursor
          />
          <div className="install-box-bottom">
            <span className="ready-dot" />
            <span>
              Open the <strong>Local</strong> URL printed in your terminal. The
              default is{" "}
              <a
                href="http://127.0.0.1:3000"
                target="_blank"
                rel="noopener noreferrer"
              >
                http://127.0.0.1:3000
              </a>
              . Keep the terminal running.
            </span>
          </div>
        </div>
      </div>
      <details className="install-troubleshooting">
        <summary>Already installed, or having trouble?</summary>
        <div className="install-troubleshooting-grid">
          <div>
            <h3>Already downloaded?</h3>
            <p>
              Do not clone into an existing <code>rampkit</code> folder again.
              Open that folder in your terminal. Stop the server with Ctrl+C
              before updating.
            </p>
            <InstallSnippet
              label="Copy update commands"
              command={
                "git pull --ff-only\nnpm ci\nnpx playwright install chromium\nnpm run dev"
              }
            />
          </div>
          <div>
            <h3>Port 3000 is busy?</h3>
            <p>
              The terminal may show a different port. Open that exact URL, or
              choose an unused port explicitly:
            </p>
            <InstallSnippet
              label="Copy alternate port command"
              command="npm run dev -- --port 3001"
            />
          </div>
          <div>
            <h3>Command not found?</h3>
            <p>
              Install Node.js and Git using the links below, then restart your
              terminal. Check <code>node --version</code>,{" "}
              <code>npm --version</code> and <code>git --version</code>.
            </p>
          </div>
          <div>
            <h3>npm cannot find package.json?</h3>
            <p>
              Your terminal is in the wrong folder. Open it in the downloaded
              Rampkit repository, where <code>package.json</code> is located,
              then run the start command.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}

function InstallSnippet({
  label,
  command,
}: {
  label: string;
  command: string;
}) {
  return (
    <div className="install-snippet">
      <CopyButton
        className="copy-install"
        aria-label={label}
        onCopy={() => navigator.clipboard.writeText(command)}
      >
        Copy commands
      </CopyButton>
      <pre>
        <code>{command}</code>
      </pre>
    </div>
  );
}

function TerminalTitle({ label }: { label: string }) {
  return (
    <div className="terminal-titlebar">
      <span className="terminal-window-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="terminal-window-title">{label}</span>
      <span className="terminal-shell" aria-hidden="true">
        shell
      </span>
    </div>
  );
}

function TerminalCommands({
  command,
  label,
  cursor = false,
}: {
  command: string;
  label: string;
  cursor?: boolean;
}) {
  return (
    <pre className="terminal-commands" aria-label={label}>
      {command.split("\n").map((line, index, lines) => (
        <span className="terminal-line" key={index}>
          <span className="terminal-prompt" aria-hidden="true">
            ❯
          </span>
          <code>
            {line}
            {cursor && index === lines.length - 1 && (
              <span className="terminal-cursor" aria-hidden="true" />
            )}
          </code>
        </span>
      ))}
    </pre>
  );
}
