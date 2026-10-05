import { test, expect } from "@playwright/test";
import { chooseOption } from "./select-option";

test("infinite canvas studies preserve colors, pan, zoom, undo and save/import", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Workspace" });
  await nav.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.getByRole("tab", { name: "Color studies", exact: true }).click();
  const board = page.getByRole("region", { name: "Infinite color canvas" });
  await expect(board).toBeVisible();
  await page.getByLabel("Canvas color", { exact: true }).fill("bad-color");
  await page.getByRole("button", { name: "Color", exact: true }).click();
  await expect(page.locator(".canvas-workspace [role=alert]")).toContainText(
    "Enter a usable",
  );
  await page
    .getByLabel("Canvas color", { exact: true })
    .fill("rgb(38, 121, 243)");
  await page.getByRole("button", { name: "Color", exact: true }).click();
  const cards = board.locator(".canvas-node");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("#2679f3");
  const start = await cards.first().boundingBox();
  await page.mouse.move(start!.x + 20, start!.y + 12);
  await page.mouse.down();
  await page.mouse.move(start!.x + 160, start!.y + 72, { steps: 8 });
  await page.mouse.up();
  const moved = await cards.first().boundingBox();
  expect(moved!.x - start!.x).toBeCloseTo(140, 0);
  await page
    .getByRole("button", { name: "Duplicate selected objects" })
    .click();
  await expect(cards).toHaveCount(2);
  await page.getByRole("button", { name: "Undo canvas change" }).click();
  await expect(cards).toHaveCount(1);
  await page.getByRole("button", { name: "Redo canvas change" }).click();
  await expect(cards).toHaveCount(2);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.getByLabel("Canvas zoom")).toHaveText("120%");
  const before = await cards.first().boundingBox();
  const area = await board.boundingBox();
  await page.mouse.move(area!.x + 12, area!.y + 12);
  await page.mouse.down();
  await page.mouse.move(area!.x + 72, area!.y + 52, { steps: 5 });
  await page.mouse.up();
  expect((await cards.first().boundingBox())!.x - before!.x).toBeCloseTo(60, 0);
  await board.focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await expect(cards).toHaveCount(0);
  await page.getByRole("button", { name: "Undo canvas change" }).click();
  await expect(cards).toHaveCount(2);
  await page.getByLabel("Canvas note").fill("Study in blue");
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(cards).toHaveCount(3);
  await nav.getByRole("button", { name: "Palettes", exact: true }).click();
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
  await nav.getByRole("button", { name: "Canvas", exact: true }).click();
  await expect(cards).toHaveCount(3);
  await page.getByLabel("Canvas palette").click();
  await page.getByRole("option", { name: "Blue", exact: true }).click();
  await page.getByRole("button", { name: "Add palette", exact: true }).click();
  await expect(cards).toHaveCount(4);
  await expect(cards.last().locator(".canvas-node-colors > div")).toHaveCount(
    12,
  );
  const color = await cards
    .first()
    .locator(".canvas-node-colors span")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.getByRole("switch", { name: "Art theme" }).click();
  expect(
    await cards
      .first()
      .locator(".canvas-node-colors span")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe(color);
  await page.getByRole("button", { name: "Fit canvas objects" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save study", exact: true }).click();
  const saved = await download;
  const studyPath = testInfo.outputPath("study.json");
  await saved.saveAs(studyPath);
  await board.focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await expect(cards).toHaveCount(0);
  await page
    .getByLabel("Import color study")
    .setInputFiles(studyPath);
  await expect(cards).toHaveCount(4);
  await page.getByRole("button", { name: "Fit canvas objects" }).click();
  await page.screenshot({
    path: "docs/design/screenshots/color-canvas-art.png",
  });
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(board).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await nav.getByRole("button", { name: "Palettes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Inspect blue-500", exact: true }),
  ).toContainText("#2679f3");
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  await nav.getByRole("button", { name: "Canvas", exact: true }).click();
  await chooseOption(page.getByLabel("Canvas token"), "blue-500");
  await page.getByRole("button", { name: "Add token", exact: true }).click();
  await expect(cards).toHaveCount(5);
  await expect(cards.last()).toContainText("Anchor");
  await page.getByRole("button", { name: "Add color", exact: true }).click();
  const sourceDialog = page.getByRole("dialog", {
    name: "Add color",
    exact: true,
  });
  await sourceDialog.getByLabel("Color", { exact: true }).fill("#bb3333");
  await sourceDialog
    .getByRole("button", { name: "Add color", exact: true })
    .click();
  await nav.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.getByLabel("Canvas source").click();
  await page.getByRole("option", { name: "#bb3333", exact: true }).click();
  await page.getByRole("button", { name: "Add source", exact: true }).click();
  await expect(cards).toHaveCount(6);
  await expect(cards.last()).toContainText("#bb3333");
  await expect(cards.last()).toContainText("Source");
  await page.getByLabel("Import color study").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"not-a-study"}'),
  });
  await expect(page.locator(".canvas-workspace [role=alert]")).toContainText(
    "valid Rampkit",
  );
  await expect(cards).toHaveCount(6);
  await page.keyboard.press("Control+l");
  await expect(
    page.getByRole("textbox", { name: "Website URL", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Control+6");
  await expect(board).toBeVisible();
  const zoomBefore = await page.getByLabel("Canvas zoom").textContent();
  const wheelArea = await board.boundingBox();
  await page.mouse.move(wheelArea!.x + 20, wheelArea!.y + 20);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -60);
  await page.keyboard.up("Control");
  await expect(page.getByLabel("Canvas zoom")).not.toHaveText(zoomBefore!);
});
