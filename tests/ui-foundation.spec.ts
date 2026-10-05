import { chooseOption } from "./select-option";
import { test, expect } from "@playwright/test";

test("top navigation, compact controls, aligned dropdowns and keyboard access", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Create Palette", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByLabel("Application appearance")).toHaveCount(0);
  await expect(page.getByLabel("Token preview")).toHaveCount(0);
  for (const selector of ["body", ".toolbar"]) {
    expect(
      await page
        .locator(selector)
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("lab(100 0 0)");
  }
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Source", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add color", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "Create palette from selection",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Palettes", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Website URL" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Analyze", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("button", { name: "Analyze", exact: true })).toBeFocused();
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Create Palette" });
  await dialog.getByLabel("Palette name").fill("Neutral");
  await dialog.getByLabel("Anchor", { exact: true }).fill("#262626");
  await chooseOption(dialog.getByLabel("Position", { exact: true }), "800");
  const dropdown = await dialog
    .getByLabel("Position", { exact: true })
    .evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        radius: style.borderRadius,
        padding: style.paddingRight,
        position: style.backgroundPosition,
        image: style.backgroundImage,
        font: style.fontFamily,
      };
    });
  expect(dropdown.radius).toBe("9999px");
  expect(dropdown.padding).toBe("36px");
  expect(dropdown.position).toBe("calc(100% - 12px) 50%");
  expect(dropdown.image).toContain("data:image/svg+xml");
  expect(dropdown.font).toContain("system-ui");
  const box = await dialog.boundingBox();
  expect(Math.abs(box!.x + box!.width / 2 - 720)).toBeLessThan(2);
  expect(Math.abs(box!.y + box!.height / 2 - 500)).toBeLessThan(2);
  await page.screenshot({ path: "docs/design/screenshots/create-palette.png" });
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Neutral palette" }),
  ).toBeVisible();
  const tabsBox = await page
    .getByRole("tablist", { name: "Palette sections" })
    .boundingBox();
  const createBox = await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .boundingBox();
  expect(
    Math.abs(
      tabsBox!.y + tabsBox!.height / 2 - createBox!.y - createBox!.height / 2,
    ),
  ).toBeLessThan(1);
  const scaleGeometry = await page
    .locator(".ramp-stop")
    .evaluateAll((elements) => {
      const first = elements[0].getBoundingClientRect();
      const second = elements[1].getBoundingClientRect();
      const color = elements[0]
        .querySelector(".ramp-color")!
        .getBoundingClientRect();
      return {
        gap: second.x - first.right,
        padding: color.x - first.x,
        height: color.height,
      };
    });
  expect(scaleGeometry.gap).toBeGreaterThanOrEqual(8);
  expect(scaleGeometry.padding).toBeGreaterThanOrEqual(4);
  expect(scaleGeometry.height).toBe(56);
  await page.getByRole("button", { name: "Inspect neutral-800" }).click();
  await expect(
    page.getByRole("complementary", { name: "Palette stop inspector" }),
  ).toContainText("#262626");
  await page.setViewportSize({ width: 1024, height: 768 });
  const shellGeometry = await page.evaluate(() => {
    const navigation = document.querySelector(".top-navigation")!.getBoundingClientRect();
    const logo = document.querySelector(".wordmark")!.getBoundingClientRect();
    const form = document
      .querySelector(".floating-analysis")!
      .getBoundingClientRect();
    const column = document
      .querySelector(".workspace-column")!
      .getBoundingClientRect();
    return {
      headerAlignment: Math.abs(navigation.y + navigation.height / 2 - logo.y - logo.height / 2),
      bottomGap: innerHeight - form.bottom,
      centered: Math.abs(form.x + form.width / 2 - column.x - column.width / 2),
    };
  });
  expect(shellGeometry.headerAlignment).toBeLessThan(1);
  expect(shellGeometry.bottomGap).toBe(16);
  expect(shellGeometry.centered).toBeLessThan(1);
  await expect(page.locator(".workspace-heading h1")).toHaveCSS(
    "font-size",
    "12px",
  );
  await expect(page.locator(".view h1")).toHaveCount(0);

  expect(
    await page.locator("body").evaluate((el) => el.scrollWidth),
  ).toBeLessThanOrEqual(1024);
  await page.screenshot({
    path: "docs/design/screenshots/palette-inspector-1024.png",
  });
  expect(
    await page
      .locator(".workspace-meta")
      .evaluate((el) => getComputedStyle(el).gap),
  ).toBe("8px");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  await chooseOption(page.getByLabel("Token preview"), "dark");
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("lab(100 0 0)");
  await expect(page.getByLabel("Map text-primary")).toHaveAttribute(
    "data-value",
    "",
  );
});
