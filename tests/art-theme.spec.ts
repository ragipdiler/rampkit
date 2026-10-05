import { test, expect } from "@playwright/test";
import { chooseOption } from "./select-option";

test("Art appearance preserves anchors, exports and independent token theme", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const toggle = page.getByRole("switch", { name: "Art theme" });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create Palette",
    exact: true,
  });
  await dialog.getByLabel("Palette name").fill("Neutral");
  await dialog.getByLabel("Anchor", { exact: true }).fill("#262626");
  await chooseOption(dialog.getByLabel("Position", { exact: true }), "800");
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const anchor = page.getByRole("button", {
    name: "Inspect neutral-800",
    exact: true,
  });
  const originalColor = await anchor
    .locator(".ramp-color")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-ui-theme", "art");
  await expect(page.locator("body")).toHaveCSS(
    "font-family",
    "system-ui, sans-serif",
  );
  await expect(anchor).toContainText("#262626");
  expect(
    await anchor
      .locator(".ramp-color")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe(originalColor);
  await page.getByRole("button", { name: "Regenerate", exact: true }).click();
  await expect(anchor).toContainText("#262626");
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  const nav = page.getByRole("navigation", { name: "Workspace" });
  await nav.getByRole("button", { name: "Export", exact: true }).click();
  await chooseOption(page.getByLabel("Export format"), "json");
  const before = await page.getByLabel("Export preview").textContent();
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-ui-theme",
    "classic",
  );
  await expect(page.getByLabel("Export preview")).toHaveText(before!);
  await nav.getByRole("button", { name: "Tokens", exact: true }).click();
  const dark = page.getByRole("radio", { name: "Dark", exact: true });
  await dark.click();
  await toggle.click();
  await expect(dark).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(dark).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "lab(100 0 0)",
  );
});

test("Art dialogs, portal selects, keyboard focus and compact desktop layout work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("switch", { name: "Art theme" }).click();
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create Palette",
    exact: true,
  });
  await dialog.getByLabel("Palette name").fill("Accent");
  await dialog.getByLabel("Anchor", { exact: true }).fill("#ef5b35");
  await dialog.getByLabel("Position", { exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCSS(
    "font-family",
    "system-ui, sans-serif",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await chooseOption(dialog.getByLabel("Position", { exact: true }), "500");
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Inspect accent-500", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Palette stop inspector" }),
  ).toContainText("#ef5b35");
  expect(
    await page.locator("body").evaluate((el) => el.scrollWidth),
  ).toBeLessThanOrEqual(1024);
  await page.getByRole("textbox", { name: "Website URL" }).focus();
  await expect(page.locator(".url-field")).toHaveCSS(
    "border-color",
    "rgb(1, 128, 250)",
  );
  await page.screenshot({
    path: "docs/design/screenshots/art-inspector-1024.png",
  });
  await page.keyboard.press("Control+k");
  const menu = page.getByRole("dialog", { name: "Command menu", exact: true });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("font-family", "system-ui, sans-serif");
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
});

test("Art engraving and editorial typography stay decorative and restore Classic", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("switch", { name: "Art theme" }).click();
  await expect(page.locator(".art-colophon")).toHaveCount(0);
  await expect(page.locator(".workspace-heading h1")).toHaveCSS(
    "font-family",
    "system-ui, sans-serif",
  );
  expect(
    await page
      .locator(".empty-illustration")
      .evaluate((el) => getComputedStyle(el, "::before").backgroundImage),
  ).toContain("/art/atelier.svg");
  await page.screenshot({ path: "docs/design/screenshots/art-empty-1440.png" });
  await page.getByRole("switch", { name: "Art theme" }).click();
  await expect(page.locator(".art-colophon")).toHaveCount(0);
  await expect(page.locator(".workspace-heading h1")).toHaveCSS(
    "font-family",
    "system-ui, sans-serif",
  );
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "lab(100 0 0)",
  );
});
