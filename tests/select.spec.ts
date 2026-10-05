import { openWorkspace } from "./open-workspace";
import { test, expect } from "@playwright/test";

test("dropdown keyboard navigation, dialog Escape, styled open state and long lists", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openWorkspace(page);
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create Palette",
    exact: true,
  });
  await dialog.getByLabel("Palette name").fill("Neutral");
  await dialog.getByLabel("Anchor", { exact: true }).fill("#262626");
  const position = dialog.getByRole("combobox", {
    name: "Position",
    exact: true,
  });
  await position.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("option", { name: "25", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("option", { name: "50", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(position).toHaveAttribute("data-value", "50");
  await expect(position).toBeFocused();
  await position.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await position.click();
  await page.keyboard.press("End");
  await expect(page.getByRole("option").last()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(position).toHaveAttribute("data-value", "950");
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  const theme = page.getByRole("radiogroup", { name: "Token preview" });
  await theme.getByRole("radio", { name: "Dark", exact: true }).click();
  await expect(theme).toHaveAttribute("data-value", "dark");
  await page.setViewportSize({ width: 1024, height: 768 });
  const mapping = page.getByRole("combobox", {
    name: "Map text-primary",
    exact: true,
  });
  const chevron = await mapping.evaluate((el) => ({
    image: getComputedStyle(el).backgroundImage,
    position: getComputedStyle(el).backgroundPosition,
  }));
  await mapping.hover();
  await expect(mapping).toHaveCSS("background-image", chevron.image);
  await expect(mapping).toHaveCSS("background-position", chevron.position);
  await mapping.click();
  const openTrigger = page.locator(
    '.select-trigger[aria-label="Map text-primary"]',
  );
  await expect(openTrigger).toHaveCSS("background-image", chevron.image);
  await expect(openTrigger).toHaveCSS("background-position", chevron.position);
  await expect(page.locator(".searchable-select")).toHaveCSS("border-radius", "12px");
  await expect(page.locator(".searchable-select")).toHaveCSS(
    "background-color",
    "lab(100 0 0)",
  );
  await page.screenshot({
    path: "docs/design/screenshots/dropdown-token-mapping.png",
  });
  const menu = page.getByRole("listbox");
  const box = await menu.boundingBox();
  expect(box!.height).toBeLessThanOrEqual(320);
  expect(box!.x).toBeGreaterThanOrEqual(8);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1016);
  const search = page.getByRole("combobox", { name: "Search Map text-primary" });
  await search.fill("neutral-950");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("combobox", { name: "Map text-primary", exact: true }),
  ).toHaveAttribute("data-value", "neutral-950");
});
