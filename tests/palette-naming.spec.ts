import { test, expect } from "@playwright/test";

test("palette names follow color input until edited, avoid duplicates and prefill from sources", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create Palette",
    exact: true,
  });
  const name = dialog.getByRole("textbox", {
    name: "Palette name",
    exact: true,
  });
  const anchor = dialog.getByLabel("Anchor", { exact: true });
  await expect(name).toHaveValue("");
  await anchor.fill("#2679f3");
  await expect(name).toHaveValue("Blue");
  await anchor.fill("rgb(239, 91, 53)");
  await expect(name).toHaveValue("Orange");
  await anchor.fill("#zzzzzz");
  await expect(name).toHaveValue("");
  await anchor.fill("#2679f3");
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Blue palette", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await anchor.fill("rgb(38, 121, 243)");
  await expect(name).toHaveValue("Blue 2");
  await name.fill("Brand");
  await anchor.fill("#ef5b35");
  await expect(name).toHaveValue("Brand");
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Inspect brand-500", exact: true }),
  ).toContainText("#ef5b35");
  await page.getByRole("button", { name: "Add color", exact: true }).click();
  const manual = page.getByRole("dialog", { name: "Add color", exact: true });
  await manual.getByLabel("Color", { exact: true }).fill("#22aa66");
  await manual.getByRole("button", { name: "Add color", exact: true }).click();
  await page
    .getByRole("button", { name: "Create palette from selection", exact: true })
    .click();
  await expect(name).toHaveValue("Green");
  await expect(anchor).toHaveValue("#22aa66");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
});
