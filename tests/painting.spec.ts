import { test, expect } from "@playwright/test";

test("painting blends pigments, collects exact colors and creates preserved palette anchors", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Workspace" });
  await nav.getByRole("button", { name: "Canvas", exact: true }).click();
  const paper = page.getByLabel("Infinite painting paper", { exact: true });
  await expect(paper).toBeVisible();
  const rect = (await paper.boundingBox())!;
  const tray = (await page
    .locator(".paint-paper .paint-materials")
    .boundingBox())!;
  const strokeY = tray.y + tray.height - rect.y + 40;
  async function stroke(from: number, to: number, y: number) {
    await page.mouse.move(rect.x + from, rect.y + y);
    await page.mouse.down();
    await page.mouse.move(rect.x + to, rect.y + y, { steps: 24 });
    await page.mouse.up();
  }
  await stroke(180, 520, strokeY);
  await page
    .getByRole("button", { name: "Use Golden yellow paint", exact: true })
    .click();
  await stroke(520, 180, strokeY);
  const mixed = await paper.evaluate((el, y) => {
    const c = el as HTMLCanvasElement,
      ratio = c.width / c.clientWidth;
    const rgb = [
      ...c
        .getContext("2d")!
        .getImageData(Math.floor(350 * ratio), Math.floor(y * ratio), 1, 1)
        .data,
    ].slice(0, 3);
    return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }, strokeY);
  expect(mixed).not.toBe("#ffffff");
  expect(mixed).not.toBe("#002185");
  expect(mixed).not.toBe("#fcd200");
  await page
    .getByRole("button", { name: "Collect color", exact: true })
    .click();
  await page.mouse.click(rect.x + 350, rect.y + strokeY);
  const swatch = page.getByRole("button", {
    name: "Paint with discovered color 1",
    exact: true,
  });
  await expect(swatch).toBeVisible();
  const collected = await swatch.evaluate((el) => {
    const rgb = getComputedStyle(el)
      .backgroundColor.match(/\d+/g)!
      .slice(0, 3)
      .map(Number);
    return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  });
  expect(collected).toBe(mixed);
  await page
    .getByRole("button", { name: "Create palette", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create Palette",
    exact: true,
  });
  await expect(dialog.getByLabel("Anchor", { exact: true })).toHaveValue(
    collected,
  );
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await expect(page.locator(".palette-block").first()).toContainText(collected);
  await nav.getByRole("button", { name: "Canvas", exact: true }).click();
  const paintingDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save painting", exact: true })
    .click();
  const paintingPath = testInfo.outputPath("painting.json");
  await (await paintingDownload).saveAs(paintingPath);
  await page.getByRole("button", { name: "Undo paint stroke" }).click();
  await page.getByRole("button", { name: "Undo paint stroke" }).click();
  await page
    .getByLabel("Open painting file")
    .setInputFiles(paintingPath);
  await expect(page.locator(".paint-footer")).toContainText("Painting opened");
  await page.getByRole("button", { name: "Fit painting", exact: true }).click();
  await page
    .getByRole("button", { name: "Collect gradient", exact: true })
    .click();
  const zoom = await paper.evaluate((el) => el.getBoundingClientRect().width);
  expect(zoom).toBeGreaterThan(500);
  // Move between the edges of the fitted painted band, collecting real marks only.
  const area = (await paper.boundingBox())!;
  await page.mouse.move(area.x + area.width * 0.3, area.y + area.height / 2);
  await page.mouse.down();
  await page.mouse.move(area.x + area.width * 0.7, area.y + area.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(page.locator(".paint-discoveries")).toContainText(
    "Found gradient",
  );
  const gradientDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save gradient", exact: true })
    .click();
  expect((await gradientDownload).suggestedFilename()).toBe(
    "paint-gradient.css",
  );
  await page
    .getByRole("button", { name: "Gather colors", exact: true })
    .click();
  await expect(page.locator(".paint-found button").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Clear painting", exact: true })
    .click();
  await expect(page.locator(".paint-paper-hint")).toBeVisible();
  await page
    .getByRole("button", { name: "Undo paint stroke", exact: true })
    .click();
  await expect(page.locator(".paint-paper-hint")).toBeHidden();
  await page.getByLabel("Open painting file").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "rampkit-painting",
        version: 1,
        strokes: [{ pigment: "bad" }],
      }),
    ),
  });
  await expect(page.locator(".paint-footer")).toContainText("not a valid");
  await expect(page.locator(".paint-paper-hint")).toBeHidden();
  await page.getByRole("switch", { name: "Art theme" }).click();
  await page.screenshot({
    path: "docs/design/screenshots/painting-atelier-art.png",
  });
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(paper).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
