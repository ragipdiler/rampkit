import { test, expect } from "@playwright/test";
import { openWorkspace } from "./open-workspace";
import { chooseOption } from "./select-option";

test("source selection creates independent scales and custom palettes keep their exact colors", async ({
  page,
}) => {
  await openWorkspace(page);
  const colors = ["#dc3e3e", "#0185ff", "#fabb04", "#34a852", "#000000"];
  for (const color of colors) {
    await page.getByRole("button", { name: "Add color", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add color", exact: true });
    await dialog.getByLabel("Color", { exact: true }).fill(color);
    await dialog
      .getByRole("button", { name: "Add color", exact: true })
      .click();
  }
  for (const color of colors.slice(0, -1))
    await page
      .getByRole("button", { name: `Select ${color}`, exact: true })
      .click();
  await page
    .getByRole("button", {
      name: "Create palettes from selection",
      exact: true,
    })
    .click();
  const batch = page.getByRole("dialog", {
    name: "Create palettes from selection",
    exact: true,
  });
  await expect(batch.getByLabel("Color 1", { exact: true })).toBeVisible();
  expect(
    await batch.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  expect(
    await batch
      .locator(".collection-rows")
      .evaluate(
        (element) =>
          element.scrollWidth <= element.clientWidth &&
          element.scrollHeight <= element.clientHeight,
      ),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await batch.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const anchors = await batch
    .locator('input[aria-label^="Color "]')
    .evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );
  for (let index = 0; index < 5; index++)
    await batch
      .getByLabel(`Palette ${index + 1} name`)
      .fill(`Anchor ${index + 1}`);
  await batch
    .getByRole("button", { name: "Create 5 palettes", exact: true })
    .click();
  await expect(page.locator(".palette-block")).toHaveCount(5);
  for (let index = 0; index < 5; index++) {
    const palette = page.getByRole("region", {
      name: `Anchor ${index + 1} palette`,
      exact: true,
    });
    await expect(palette.locator(".ramp-stop")).toHaveCount(12);
    await expect(palette.locator(".lock-dot")).toHaveCount(1);
    await expect(palette).toContainText("1 locked");
    await palette
      .getByRole("button", {
        name: `Inspect anchor-${index + 1}-500`,
        exact: true,
      })
      .click();
    const inspector = page.getByRole("complementary", {
      name: "Palette stop inspector",
    });
    await expect(inspector).toContainText(anchors[index]);
    await page.keyboard.press("Escape");
  }
  await page
    .getByRole("button", { name: "Add custom palette", exact: true })
    .click();
  const custom = page.getByRole("dialog", {
    name: "Add custom palette",
    exact: true,
  });
  await custom.getByLabel("Palette name").fill("Duo");
  await custom.getByLabel("Color 1", { exact: true }).fill("#ff000080");
  await custom.getByLabel("Color 2", { exact: true }).fill("#0000ff");
  await custom
    .getByRole("button", { name: "Add palette", exact: true })
    .click();
  const duo = page.getByRole("region", { name: "Duo palette", exact: true });
  await expect(duo.locator(".ramp-stop")).toHaveCount(2);
  await expect(
    duo.getByRole("button", { name: "Regenerate", exact: true }),
  ).toHaveCount(0);
  await duo.getByRole("button", { name: "Inspect duo-2", exact: true }).click();
  await page.getByLabel("Stop color", { exact: true }).fill("#00ff00");
  await page.getByRole("button", { name: "Apply color", exact: true }).click();
  await expect(duo).toContainText("#00ff00");
  await expect(duo).toContainText("#ff000080");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  await page.getByRole("tab", { name: "Primitives 62", exact: true }).click();
  await expect(page.locator(".primitive-item")).toHaveCount(62);
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Export", exact: true })
    .click();
  await chooseOption(page.getByLabel("Export format"), "json");
  const output = JSON.parse(
    await page.getByLabel("Export preview").innerText(),
  );
  expect(
    output.primitives.filter(
      (token: { family: string }) => token.family === "duo",
    ),
  ).toHaveLength(2);
});
