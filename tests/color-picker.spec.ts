import { test, expect } from "@playwright/test";

test("Canvas picker shares accurate modes, alpha, saved colors and canvas sampling", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Canvas", exact: true })
    .click();
  const trigger = page.getByRole("button", { name: "Open paint color picker" });
  await trigger.click();
  const picker = page.getByRole("dialog", { name: "Colors", exact: true });
  await expect(picker).toBeVisible();
  await picker.getByRole("tab", { name: "Sliders", exact: true }).click();
  await picker.getByLabel("Picker HEX", { exact: true }).fill("2679f3");
  await expect(picker.getByLabel("Red value")).toHaveValue("38");
  await expect(picker.getByLabel("Green value")).toHaveValue("121");
  await picker.getByLabel("Picker HEX", { exact: true }).fill("26");
  await expect(picker.getByLabel("Red value")).toHaveValue("38");
  await picker.getByLabel("Picker opacity").fill("50");
  await picker.getByRole("button", { name: "Remember picker color" }).click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const paper = page.getByLabel("Infinite painting paper", { exact: true });
  const r = (await paper.boundingBox())!;
  const tray = (await page.locator(".paint-materials").boundingBox())!;
  const strokeY = tray.y + tray.height + 40;
  await page.mouse.move(r.x + 160, strokeY);
  await page.mouse.down();
  await page.mouse.move(r.x + 320, strokeY, { steps: 12 });
  await page.mouse.up();
  const saved = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save painting", exact: true })
    .click();
  const path = await (await saved).path();
  const { readFile } = await import("node:fs/promises");
  const file = JSON.parse(await readFile(path!, "utf8"));
  expect(file.strokes[0].pigment).toBe("#2679f3");
  expect(file.strokes[0].opacity).toBe(0.5);
  await trigger.click();
  await expect(
    picker.getByRole("button", { name: "Use saved color #2679f3" }),
  ).toBeVisible();
  await picker.getByRole("tab", { name: "Spectrum", exact: true }).click();
  await picker.getByLabel("Spectrum hue").fill("120");
  await picker.getByLabel("Spectrum saturation").fill("100");
  await picker.getByLabel("Spectrum brightness").fill("100");
  await picker.getByRole("tab", { name: "Sliders", exact: true }).click();
  await expect(picker.getByLabel("Picker HEX", { exact: true })).toHaveValue(
    "00ff00",
  );
  await picker.getByRole("button", { name: "Sample canvas color" }).click();
  await expect(picker).toBeHidden();
  await page.mouse.click(r.x + 230, strokeY);
  await expect(page.locator(".paint-name")).toHaveText("Sampled paint");
  await page.getByRole("tab", { name: "Color studies", exact: true }).click();
  await page.getByRole("button", { name: "Open study color picker" }).click();
  await picker
    .getByRole("button", { name: "Choose #003366 color 13", exact: true })
    .click();
  await picker.getByLabel("Picker opacity").fill("50");
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Canvas color", { exact: true })).toHaveValue(
    "#00336680",
  );
  await page.getByRole("button", { name: "Color", exact: true }).click();
  await expect(page.locator(".canvas-node")).toHaveCount(1);
  for (const target of [
    ".toolbar",
    ".top-navigation",
    ".workspace-meta",
    ".canvas-board",
    ".canvas-add-toolbar input",
  ]) {
    const style = await page
      .locator(target)
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return [
          s.borderTopWidth,
          s.borderRightWidth,
          s.borderBottomWidth,
          s.borderLeftWidth,
        ];
      });
    expect(style).toEqual(["0px", "0px", "0px", "0px"]);
  }
  for (const target of [
    ".top-navigation > button",
    ".canvas-add-toolbar input",
    ".canvas-add-toolbar button",
    ".section-tabs > button",
  ]) {
    const heights = await page
      .locator(target)
      .evaluateAll((els) =>
        els
          .filter((el) => el.getBoundingClientRect().width > 0)
          .map((el) => el.getBoundingClientRect().height),
      );
    expect(heights.every((height) => height >= 22 && height <= 28)).toBe(true);
  }
  await page.getByRole("switch", { name: "Art theme" }).click();
  await page.getByRole("button", { name: "Open study color picker" }).click();
  await page.screenshot({
    path: "docs/design/screenshots/canvas-picker-art.png",
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(picker).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
