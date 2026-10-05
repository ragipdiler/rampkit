import { openWorkspace } from "./open-workspace";
import { test, expect } from "@playwright/test";

test("color selectors filter names, preserve mappings and support keyboard selection", async ({
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
  await dialog.getByLabel("Palette name").fill("Blue");
  await dialog.getByLabel("Anchor", { exact: true }).fill("#2679f3");
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Tokens", exact: true })
    .click();
  const mapping = page.getByRole("combobox", {
    name: "Map border-focus",
    exact: true,
  });
  await mapping.click();
  const search = page.getByRole("combobox", {
    name: "Search Map border-focus",
    exact: true,
  });
  await expect(search).toBeFocused();
  await search.fill("BLUE-400");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(mapping).toHaveAttribute("data-value", "blue-400");
  await expect(mapping).toBeFocused();
  await mapping.click();
  await search.fill("no such color");
  await expect(
    page.getByRole("status").filter({ hasText: "No colors found." }),
  ).toBeVisible();
  await expect(mapping).toHaveAttribute("data-value", "blue-400");
  await page.keyboard.press("Escape");
  await expect(mapping).toBeFocused();
  await page.getByRole("switch", { name: "Art theme" }).click();
  await mapping.click();
  await search.fill("blue-");
  await expect(page.getByRole("option")).toHaveCount(12);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(mapping).toHaveAttribute("data-value", "blue-50");
  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  await expect(mapping).toHaveAttribute("data-value", "");
  await page.getByRole("radio", { name: "Light", exact: true }).click();
  await expect(mapping).toHaveAttribute("data-value", "blue-50");
});
