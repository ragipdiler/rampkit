import { chromium } from "playwright";
import type { ColorOccurrence, ProgressCallback } from "../../core/src/models";
export interface Extraction {
  url: string;
  occurrences: ColorOccurrence[];
  warnings: string[];
}
export function validateUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a valid URL, including https:// or http://.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error(
      "Only public HTTP(S) URLs without embedded credentials are supported.",
    );
  return url;
}
export async function extractWebsite(
  input: string,
  onProgress: ProgressCallback = () => {},
  signal?: AbortSignal,
): Promise<Extraction> {
  const url = validateUrl(input);
  const warnings: string[] = [];
  onProgress("Loading page…");
  const browser = await chromium.launch({ headless: true });
  const abort = () => {
    void browser.close().catch(() => {});
  };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    if (signal?.aborted) throw new Error("Analysis cancelled.");
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    let assetFailures = 0;
    page.on("requestfailed", () => assetFailures++);
    try {
      const response = await page.goto(url.href, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });
      if (response && [401, 403, 429].includes(response.status()))
        throw new Error("Website blocked automated browser access.");
      if (response && response.status() >= 400)
        warnings.push(
          `Website returned HTTP ${response.status()}; inspecting available content.`,
        );
    } catch (error) {
      if (error instanceof Error && error.message.includes("blocked automated"))
        throw error;
      if (page.url() === "about:blank")
        throw new Error(
          "Could not load the website. Check its URL and your connection.",
        );
      warnings.push(
        "Page loading was incomplete; inspecting the available rendered content.",
      );
    }
    await page
      .waitForLoadState("networkidle", { timeout: 3000 })
      .catch(() => {});
    if (assetFailures)
      warnings.push(
        `${assetFailures} asset request(s) failed; results may be partial.`,
      );
    onProgress("Reading styles…");
    const occurrences: ColorOccurrence[] = [];
    for (const frame of page.frames()) {
      if (signal?.aborted) throw new Error("Analysis cancelled.");
      try {
        const result = await frame.evaluate(() => {
          const warnings: string[] = [];
          const output = new Map<
            string,
            {
              originalValue: string;
              cssProperty: string;
              cssVariableName?: string;
              elementTypes: string[];
              count: number;
              kind: "rendered" | "variable";
            }
          >();
          const names = new Set<string>();
          let unreadable = 0;
          function readRules(rules: CSSRuleList) {
            for (const rule of Array.from(rules)) {
              if ("style" in rule) {
                for (const property of Array.from(
                  (rule as CSSStyleRule).style,
                )) {
                  if (property.startsWith("--")) names.add(property);
                }
              }
              if ("cssRules" in rule) {
                try {
                  readRules((rule as CSSGroupingRule).cssRules);
                } catch {
                  unreadable++;
                }
              }
            }
          }
          for (const sheet of Array.from(document.styleSheets)) {
            try {
              readRules(sheet.cssRules);
            } catch {
              unreadable++;
            }
          }
          if (unreadable)
            warnings.push(
              `${unreadable} stylesheet(s) could not be read directly; computed styles were still inspected.`,
            );
          const probe = document.createElement("span");
          probe.style.display = "none";
          document.documentElement.append(probe);
          const resolved = new Map<string, string | null>();
          function asColor(raw: string): string | null {
            if (resolved.has(raw)) return resolved.get(raw)!;
            let value: string | null = null;
            if (
              CSS.supports("color", raw) &&
              ![
                "currentcolor",
                "inherit",
                "initial",
                "unset",
                "revert",
              ].includes(raw.toLowerCase())
            ) {
              probe.style.color = "";
              probe.style.color = raw;
              value = getComputedStyle(probe).color;
            }
            resolved.set(raw, value);
            return value;
          }
          function colorParts(value: string): string[] {
            const direct = asColor(value);
            if (direct) return [direct];
            return (
              value.match(
                /(?:rgba?|hsla?|oklch|oklab|lch|lab|hwb|color)\([^()]*\)|#[\da-f]{3,8}\b|\b[a-z]+\b/gi,
              ) ?? []
            ).flatMap((part) => {
              const color = asColor(part);
              return color ? [color] : [];
            });
          }
          const elements = Array.from(document.querySelectorAll("*"));
          if (elements.length > 10000)
            warnings.push(
              "DOM inspection was limited to 10,000 elements; results are partial.",
            );
          const variableSeen = new Set<string>();
          function add(
            value: string,
            property: string,
            tag: string,
            kind: "rendered" | "variable",
            variable?: string,
          ) {
            if (value === "rgba(0, 0, 0, 0)") return;
            const key = [value, property, variable ?? "", kind].join("|");
            const entry = output.get(key);
            if (entry) {
              entry.count++;
              if (!entry.elementTypes.includes(tag))
                entry.elementTypes.push(tag);
            } else
              output.set(key, {
                originalValue: value,
                cssProperty: property,
                cssVariableName: variable,
                elementTypes: [tag],
                count: 1,
                kind,
              });
          }
          for (const element of elements.slice(0, 10000)) {
            if (
              element === probe ||
              [
                "SCRIPT",
                "STYLE",
                "LINK",
                "META",
                "HEAD",
                "TITLE",
                "NOSCRIPT",
              ].includes(element.tagName)
            )
              continue;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              style.visibility === "collapse" ||
              Number(style.opacity) === 0 ||
              !rect.width ||
              !rect.height
            )
              continue;
            // Ancestor opacity/content visibility can hide descendants despite their own styles.
            let hidden = false;
            for (
              let parent = element.parentElement;
              parent;
              parent = parent.parentElement
            ) {
              const ps = getComputedStyle(parent);
              if (
                Number(ps.opacity) === 0 ||
                ps.contentVisibility === "hidden"
              ) {
                hidden = true;
                break;
              }
            }
            if (hidden) continue;
            if (
              element instanceof HTMLElement ||
              element instanceof SVGElement
            ) {
              for (const property of Array.from(element.style)) {
                if (property.startsWith("--")) names.add(property);
              }
            }
            const variables = new Map<string, string[]>();
            for (const name of names) {
              const raw = style.getPropertyValue(name).trim();
              const value = raw ? asColor(raw) : null;
              if (value) {
                const list = variables.get(value) ?? [];
                list.push(name);
                variables.set(value, list);
              }
            }
            const tag = element.tagName.toLowerCase();
            function inspect(s: CSSStyleDeclaration, pseudo = false) {
              const properties = [
                "background-color",
                "background-image",
                "box-shadow",
              ];
              if (
                pseudo ||
                Array.from(element.childNodes).some(
                  (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
                )
              )
                properties.push("color", "text-shadow");
              for (const side of ["top", "right", "bottom", "left"])
                if (
                  parseFloat(s.getPropertyValue(`border-${side}-width`)) > 0 &&
                  s.getPropertyValue(`border-${side}-style`) !== "none"
                )
                  properties.push(`border-${side}-color`);
              if (parseFloat(s.outlineWidth) > 0 && s.outlineStyle !== "none")
                properties.push("outline-color");
              if (
                element instanceof SVGElement &&
                [
                  "path",
                  "rect",
                  "circle",
                  "ellipse",
                  "line",
                  "polyline",
                  "polygon",
                  "text",
                  "tspan",
                  "use",
                ].includes(tag)
              ) {
                if (tag !== "line" && Number(s.fillOpacity) > 0)
                  properties.push("fill");
                if (Number(s.strokeOpacity) > 0) properties.push("stroke");
              }
              for (const property of properties) {
                if (property === "stroke" && parseFloat(s.strokeWidth) === 0)
                  continue;
                for (const value of colorParts(s.getPropertyValue(property))) {
                  const variableNames = variables.get(value) ?? [];
                  add(
                    value,
                    pseudo ? `${property} (pseudo)` : property,
                    tag,
                    "rendered",
                    variableNames[0],
                  );
                  for (const name of variableNames) {
                    const key = [name, value].join("|");
                    if (!variableSeen.has(key)) {
                      variableSeen.add(key);
                      add(
                        style.getPropertyValue(name).trim(),
                        name,
                        tag,
                        "variable",
                        name,
                      );
                    }
                  }
                }
              }
            }
            inspect(style);
            for (const pseudo of ["::before", "::after"]) {
              const s = getComputedStyle(element, pseudo);
              if (
                !["none", "normal", ""].includes(s.content) &&
                s.display !== "none" &&
                s.visibility !== "hidden" &&
                Number(s.opacity) > 0
              )
                inspect(s, true);
            }
          }
          probe.remove();
          return { occurrences: [...output.values()], warnings };
        });
        occurrences.push(...result.occurrences);
        warnings.push(...result.warnings);
      } catch {
        warnings.push("Some iframe styles could not be inspected.");
      }
    }
    onProgress("Extracting colors…");
    return { url: page.url(), occurrences, warnings: [...new Set(warnings)] };
  } finally {
    signal?.removeEventListener("abort", abort);
    await browser.close();
  }
}
