import { openWorkspace } from "./open-workspace";
import { test, expect } from "@playwright/test";

test("compact token groups preserve mappings across filters and themes", async ({
  page,
}) => {
  await openWorkspace(page);
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create Palette",
    exact: true,
  });
  await dialog.getByLabel("Anchor", { exact: true }).fill("#2679f3");
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  await page.getByRole("button", { name: "Tokens", exact: true }).click();
  await expect(page.locator(".semantic-row")).toHaveCount(28);
  const first = await page
    .getByRole("region", { name: "Background tokens" })
    .boundingBox();
  const second = await page
    .getByRole("region", { name: "Surface tokens" })
    .boundingBox();
  expect(first!.y).toBe(second!.y);
  const filters = page.getByRole("tablist", { name: "Semantic groups" });
  await filters.getByRole("tab", { name: "Text 4", exact: true }).click();
  await expect(page.locator(".semantic-row")).toHaveCount(4);
  const mapping = page.getByRole("combobox", {
    name: "Map text-primary",
    exact: true,
  });
  await mapping.click();
  await page.getByRole("option", { name: "blue-950", exact: true }).click();
  await filters.getByRole("tab", { name: "Status 8", exact: true }).click();
  await expect(page.locator(".semantic-group")).toHaveCount(4);
  await filters.getByRole("tab", { name: "Text 4", exact: true }).click();
  await expect(mapping).toHaveAttribute("data-value", "blue-950");
  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  await expect(mapping).toHaveAttribute("data-value", "");
  await page.getByRole("radio", { name: "Light", exact: true }).click();
  await expect(mapping).toHaveAttribute("data-value", "blue-950");
  await page.getByRole("tab", { name: "Primitives 12", exact: true }).click();
  await expect(page.locator(".primitive-item")).toHaveCount(12);
  await page.getByRole("tab", { name: "Semantic 28", exact: true }).click();
  await expect(mapping).toHaveAttribute("data-value", "blue-950");
  await filters.getByRole("tab", { name: "All 28", exact: true }).click();
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.locator(".semantic-row")).toHaveCount(28);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("switch", { name: "Art theme" }).click();
  await expect(mapping).toHaveAttribute("data-value", "blue-950");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
