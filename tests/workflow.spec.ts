import { openWorkspace } from "./open-workspace";
import { chooseOption } from "./select-option";
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { extractWebsite } from "../packages/extractor/src/index";
import {
  normalizeOccurrences,
  colorDistance,
  normalizeColor,
} from "../packages/core/src/color";
import type { SourceAnalysis } from "../packages/core/src/models";
async function addManual(page: Page, value: string) {
  await page
    .locator(".workspace-meta")
    .getByRole("button", { name: "Add color", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Add color", exact: true });
  await dialog.getByLabel("Color", { exact: true }).fill(value);
  await dialog.getByRole("button", { name: "Add color", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}
async function createSelected(page: Page, name: string, step = "500") {
  await page
    .getByRole("button", { name: "Create palette from selection", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create Palette",
    exact: true,
  });
  await dialog.getByLabel("Palette name").fill(name);
  await chooseOption(dialog.getByLabel("Position", { exact: true }), step);
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: `${name} palette` }),
  ).toBeVisible();
}
async function completeBuilderFlow(page: Page, sourceUrl: string) {
  await openWorkspace(page);
  await expect(
    page.getByRole("heading", { name: "Palettes", exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Website URL" }).fill(sourceUrl);
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(page.locator(".source-swatch").first()).toBeVisible({
    timeout: 55000,
  });
  await page.screenshot({
    path: sourceUrl.includes("firecrawl.dev")
      ? "docs/design/screenshots/source-firecrawl.png"
      : "docs/design/screenshots/source-colors.png",
    fullPage: true,
  });
  expect(
    await page
      .locator(".source-swatch")
      .first()
      .evaluate((el) => el.getBoundingClientRect().height),
  ).toBeLessThanOrEqual(112);
  // Select the actual nearest curated orange; never inject a replacement for the site's anchor.
  const colors = await page
    .locator(".source-swatch")
    .evaluateAll((elements) =>
      elements.map((el) => ({ hex: el.querySelector("strong")!.textContent! })),
    );
  const target = normalizeColor("#ff4d00")!;
  const closest = colors
    .map((c) => ({ hex: c.hex, color: normalizeColor(c.hex)! }))
    .filter(
      (c) =>
        c.color.oklch.c > 0.08 &&
        ((c.color.oklch.h ?? 0) < 85 || (c.color.oklch.h ?? 0) > 350),
    )
    .sort(
      (a, b) => colorDistance(a.color, target) - colorDistance(b.color, target),
    )[0];
  expect(
    closest,
    "The website must yield a real orange candidate.",
  ).toBeTruthy();
  await expect(page.locator(".workspace-counts")).toHaveCount(0);
  await page
    .getByRole("button", { name: `Select ${closest.hex}`, exact: true })
    .click();
  await createSelected(page, "Orange");
  const orange = page.getByRole("region", { name: "Orange palette" });
  await expect(orange.locator(".ramp-stop")).toHaveCount(12);
  await page
    .getByRole("button", { name: "Inspect orange-500", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Palette stop inspector" }),
  ).toContainText(closest.hex);
  await page.keyboard.press("Escape");
  await addManual(page, "#7c3aed");
  await createSelected(page, "Brand");
  const brand = page.getByRole("region", { name: "Brand palette" });
  await brand.getByRole("button", { name: "Add anchor", exact: true }).click();
  const anchorDialog = page.getByRole("dialog", {
    name: "Add anchor",
    exact: true,
  });
  await anchorDialog.getByLabel("Anchor", { exact: true }).fill("#262626");
  await chooseOption(
    anchorDialog.getByLabel("Position", { exact: true }),
    "800",
  );
  await anchorDialog
    .getByRole("button", { name: "Add anchor", exact: true })
    .click();
  await expect(brand).toContainText("2 locked");
  await brand.getByRole("button", { name: "Regenerate", exact: true }).click();
  await page
    .getByRole("button", { name: "Inspect brand-800", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Palette stop inspector" }),
  ).toContainText("#262626");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Inspect brand-500", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Palette stop inspector" }),
  ).toContainText("#7c3aed");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  await page.getByRole("tab", { name: "Primitives 24", exact: true }).click();
  await expect(page.locator(".primitive-item")).toHaveCount(24);
  await page.getByRole("tab", { name: "Semantic 24", exact: true }).click();
  await expect(page.getByLabel("Map text-primary")).toHaveAttribute(
    "data-value",
    "",
  );
  await chooseOption(page.getByLabel("Map text-primary"), "brand-950");
  await chooseOption(page.getByLabel("Map background-primary"), "orange-25");
  await chooseOption(page.getByLabel("Token preview"), "dark");
  await expect(page.getByLabel("Map text-primary")).toHaveAttribute(
    "data-value",
    "",
  );
  await chooseOption(page.getByLabel("Map text-primary"), "orange-25");
  await chooseOption(page.getByLabel("Map background-primary"), "brand-950");
  await chooseOption(page.getByLabel("Token preview"), "light");
  await expect(page.getByLabel("Map text-primary")).toHaveAttribute(
    "data-value",
    "brand-950",
  );
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Contrast", exact: true })
    .click();
  await expect(page.getByTestId("custom-contrast-ratio")).toBeVisible();
  await expect(page.getByRole("table")).toContainText(
    "text-primary / background-primary",
  );
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Export", exact: true })
    .click();
  for (const format of ["css", "json", "tailwind", "w3c"]) {
    await chooseOption(page.getByLabel("Export format"), format);
    const promise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download", exact: true }).click();
    const file = await promise;
    const content = await readFile((await file.path())!, "utf8");
    expect(content).toContain("orange-500");
    if (format === "json") {
      const json = JSON.parse(content);
      expect(json.primitives).toHaveLength(24);
      expect(
        json.primitives.find((t: { name: string }) => t.name === "orange-500")
          .value.hex,
      ).toBe(closest.hex);
      expect(
        json.primitives.find((t: { name: string }) => t.name === "brand-500")
          .value.hex,
      ).toBe("#7c3aed");
      expect(
        json.primitives.find((t: { name: string }) => t.name === "brand-800")
          .value.hex,
      ).toBe("#262626");
      expect(json.palettes).toHaveLength(2);
    }
  }
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Palettes", exact: true })
    .click();
  await expect(
    page.getByRole("main", { name: "Palettes workspace" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Palettes", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.screenshot({
    path: sourceUrl.includes("firecrawl.dev")
      ? "tests/screenshots/firecrawl-builder.png"
      : "tests/screenshots/builder-palettes.png",
    fullPage: true,
  });
  return closest.hex;
}
test("real extraction filters hidden colors and retains source evidence", async () => {
  const extraction = await extractWebsite("http://127.0.0.1:3987");
  const colors = normalizeOccurrences(extraction.occurrences);
  expect(colors.some((c) => c.hex === "#123456" || c.hex === "#654321")).toBe(
    false,
  );
  expect(colors.some((c) => c.hex === "#6c47ff")).toBe(true);
  expect(colors.some((c) => c.hex === "#ff9900")).toBe(true);
  expect(
    colors.some((c) =>
      c.sources.some((s) => s.cssVariableName === "--neutral-900"),
    ),
  ).toBe(true);
  await expect(extractWebsite("http://127.0.0.1:3987/blocked")).rejects.toThrow(
    "blocked automated",
  );
});
test("discovery, explicit palettes, exact multiple anchors, mappings, contrast and all exports", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await completeBuilderFlow(page, "http://127.0.0.1:3987");
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 1024, height: 768 });
  expect(
    await page.locator("body").evaluate((el) => el.scrollWidth),
  ).toBeLessThanOrEqual(1024);
});
test("standalone manual workflow: edit, lock, unlock, regenerate, rename and delete", async ({
  page,
}) => {
  await openWorkspace(page);
  await addManual(page, "oklch(.6 .2 285)");
  await createSelected(page, "Custom");
  await page.getByRole("button", { name: "Inspect custom-800" }).click();
  const inspector = page.getByRole("complementary", {
    name: "Palette stop inspector",
  });
  await inspector.getByLabel("Stop color").fill("#222222");
  await inspector.getByRole("button", { name: "Apply color" }).click();
  await expect(inspector).toContainText("#222222");
  await inspector.getByRole("button", { name: "Unlock", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Regenerate", exact: true }).click();
  await page.getByRole("button", { name: "Inspect custom-800" }).click();
  await expect(inspector.getByLabel("Stop color")).not.toHaveValue("#222222");
  await inspector.getByRole("button", { name: "Lock", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "Custom palette" }),
  ).toContainText("2 locked");
  await page.getByRole("button", { name: "Rename Custom" }).click();
  const rename = page.getByRole("dialog", { name: "Rename palette" });
  await rename.getByLabel("New name").fill("Violet");
  await rename
    .getByRole("button", { name: "Rename palette", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Violet palette" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete Violet" }).click();
  await expect(
    page.getByRole("region", { name: "Violet palette" }),
  ).toHaveCount(0);
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Command menu" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});
test("API discovery never creates tokens, and CLI generation requires explicit anchors", async ({
  request,
}) => {
  const invalid = await request.post("/api/analyze", {
    data: { url: "file:///etc/passwd" },
  });
  expect(invalid.status()).toBe(400);
  const foreignHost = await request.post("/api/analyze", {
    headers: { host: "untrusted.example" },
    data: { url: "http://127.0.0.1:3987" },
  });
  expect(foreignHost.status()).toBe(403);
  const foreignOrigin = await request.post("/api/analyze", {
    headers: { origin: "https://untrusted.example" },
    data: { url: "http://127.0.0.1:3987" },
  });
  expect(foreignOrigin.status()).toBe(403);
  const valid = await request.post("/api/analyze", {
    data: { url: "http://127.0.0.1:3987" },
  });
  const events = (await valid.text())
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const source = events.find((e) => e.type === "result")
    .report as SourceAnalysis;
  expect(source.sources.length).toBeGreaterThan(0);
  expect(source).not.toHaveProperty("primitives");
  expect(source).not.toHaveProperty("semantics");
  const empty = await request.post("/api/analyze", {
    data: { url: "http://127.0.0.1:3987/empty" },
  });
  expect(await empty.text()).toContain("no usable colors");
  execFileSync(
    "node",
    [
      "dist/cli.js",
      "http://127.0.0.1:3987",
      "--out",
      "test-results/cli-discover",
    ],
    { timeout: 40000 },
  );
  const json = JSON.parse(
    await readFile("test-results/cli-discover/127.0.0.1/sources.json", "utf8"),
  );
  expect(json).not.toHaveProperty("primitives");
  execFileSync(
    "node",
    [
      "dist/cli.js",
      "--anchor",
      "Neutral:50:#f9f9f9",
      "--anchor",
      "Neutral:800:#262626",
      "--out",
      "test-results/cli-build",
    ],
    { timeout: 40000 },
  );
  const tokens = JSON.parse(
    await readFile("test-results/cli-build/manual/tokens.json", "utf8"),
  );
  expect(tokens.primitives).toHaveLength(12);
  expect(
    tokens.primitives.find((t: { name: string }) => t.name === "neutral-800")
      .value.hex,
  ).toBe("#262626");
  expect(
    await readFile("test-results/cli-build/manual/tokens.css", "utf8"),
  ).toContain(".dark");
});
test("live Firecrawl acceptance scenario", async ({ page }) => {
  test.skip(
    process.env.RAMPKIT_LIVE_TEST !== "1",
    "Explicit live-site acceptance run; local tests remain offline.",
  );
  test.setTimeout(120000);
  const hex = await completeBuilderFlow(page, "https://firecrawl.dev");
  console.log(`Live Firecrawl anchor preserved exactly: ${hex}`);
});
