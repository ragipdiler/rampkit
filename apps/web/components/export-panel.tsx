"use client";
import { CopyButton } from "./copy-button";
import { Select, SelectOption } from "./select";
import { useState } from "react";
import { Download } from "lucide-react";
import type { TokenSystem } from "../../../packages/tokens/src/system";
import {
  exportTokens,
  EXPORT_FORMATS,
  type ExportFormat,
} from "../../../packages/tokens/src/export";
export function ExportPanel({
  report,
  copy,
}: {
  report: TokenSystem;
  copy: (text: string) => Promise<void>;
}) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const content = exportTokens(report, format);
  const info = EXPORT_FORMATS[format];
  function download() {
    const blob = new Blob([content], { type: info.mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = info.file;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="section-toolbar">
        <div className="export-controls">
          <Select
            aria-label="Export format"
            value={format}
            onValueChange={(value) => setFormat(value as ExportFormat)}
          >
            {Object.entries(EXPORT_FORMATS).map(([value, info]) => (
              <SelectOption key={value} value={value}>
                {info.label}
              </SelectOption>
            ))}
          </Select>
          <CopyButton className="button-outline" onCopy={() => copy(content)}>
            Copy
          </CopyButton>
          <button className="primary" onClick={download}>
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
      <pre className="export-code" aria-label="Export preview">
        {content}
      </pre>
    </>
  );
}
