import { openWorkspace } from "./open-workspace";
import { test, expect } from "@playwright/test";

test("top navigation shares the brand row and preserves page and keyboard actions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openWorkspace(page);
  const header = page.locator(".toolbar");
  const nav = header.getByRole("navigation", { name: "Workspace" });
  await expect(nav.getByRole("button")).toHaveCount(6);
  await expect(page.locator(".sidebar, .workspace-counts")).toHaveCount(0);
  await expect(header.getByRole("link")).toHaveAttribute(
    "href",
    "https://github.com/ragipdiler",
  );
  for (const art of [false, true]) {
    if (art) await header.getByRole("switch", { name: "Art theme" }).click();
    for (const width of [1440, 800]) {
      await page.setViewportSize({ width, height: 900 });
      const brand = await header.locator(".wordmark").boundingBox();
      const menu = await nav.boundingBox();
      const theme = await header.getByRole("switch").boundingBox();
      const profile = await header.getByRole("link").boundingBox();
      expect(
        Math.abs(brand!.y + brand!.height / 2 - menu!.y - menu!.height / 2),
      ).toBeLessThan(1);
      expect(profile!.x).toBeGreaterThan(theme!.x + theme!.width);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const name of [
        "Source",
        "Palettes",
        "Tokens",
        "Contrast",
        "Export",
        "Canvas",
      ]) {
        const item = nav.getByRole("button", { name, exact: true });
        await item.click();
        await expect(item).toHaveAttribute("aria-current", "page");
        await expect(
          page.getByRole("heading", { name, exact: true }),
        ).toBeVisible();
        await expect(item).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      }
    }
  }
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Command menu" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+1");
  await expect(
    page.getByRole("heading", { name: "Source", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add color", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Add color", exact: true }),
  ).toBeVisible();
});
