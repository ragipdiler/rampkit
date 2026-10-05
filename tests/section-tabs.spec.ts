import { test, expect } from "@playwright/test";
import { chooseOption } from "./select-option";

test("section tabs expose evidence, ignored colors and generation without accordions", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add color", exact: true }).click();
  const add = page.getByRole("dialog", { name: "Add color", exact: true });
  await add.getByLabel("Color", { exact: true }).fill("#262626");
  await add.getByRole("button", { name: "Add color", exact: true }).click();
  const tabs = page.getByRole("tablist", {
    name: "Source sections",
    exact: true,
  });
  await expect(tabs.getByRole("tab")).toHaveCount(5);
  for (const tab of await tabs.getByRole("tab").all())
    await expect(tab).toBeInViewport();
  const inspector = page.getByRole("complementary", {
    name: "Source inspector",
  });
  await inspector.getByRole("tab", { name: /Evidence/ }).click();
  await expect(
    inspector.getByRole("region", { name: "Original evidence" }),
  ).toContainText("#262626");
  await inspector.getByRole("tab", { name: "Color", exact: true }).click();
  await inspector.getByRole("button", { name: "Ignore color" }).click();
  await tabs.getByRole("tab", { name: /Ignored/ }).click();
  await expect(
    page.getByRole("region", { name: "Ignored colors" }),
  ).toContainText("#262626");
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await tabs.getByRole("tab", { name: /Colors/ }).click();
  await expect(
    page.getByRole("button", { name: "Select #262626" }),
  ).toBeVisible();
  await tabs.getByRole("tab", { name: /Colors/ }).focus();
  await page.keyboard.press("End");
  await expect(tabs.getByRole("tab", { name: /Notes/ })).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Extraction notes" }),
  ).toContainText("No extraction notes");
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Palettes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const create = page.getByRole("dialog", {
    name: "Create Palette",
    exact: true,
  });
  await create.getByLabel("Palette name").fill("Neutral");
  await create.getByLabel("Anchor", { exact: true }).fill("#262626");
  await chooseOption(create.getByLabel("Position", { exact: true }), "800");
  await create
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await page
    .getByRole("tab", { name: "Generation settings", exact: true })
    .click();
  await chooseOption(page.getByLabel("Neutral lightness curve"), "soft");
  await page.getByRole("button", { name: "Regenerate", exact: true }).click();
  await page.getByRole("tab", { name: "Scales", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Inspect neutral-800", exact: true }),
  ).toContainText("#262626");
  await expect(page.locator("details")).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Tokens", exact: true })
    .click();
  await expect(
    page.getByRole("radiogroup", { name: "Token preview" }),
  ).toHaveCSS("border-top-width", "0px");
});
