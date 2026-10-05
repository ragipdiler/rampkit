import { test, expect } from "@playwright/test";

test("floating paint tray pages colors without scrolling and preserves painting", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Canvas", exact: true })
    .click();
  const tray = page.locator(".paint-paper .paint-materials");
  await expect(tray).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Previous paint colors", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Next paint colors", exact: true })
    .click();
  const black = page.getByRole("button", {
    name: "Use Ivory black paint",
    exact: true,
  });
  await expect(black).toBeVisible();
  await black.click();
  await expect(black).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".paint-name")).toHaveText("Ivory black");
  await expect(
    page.getByRole("button", { name: "Next paint colors", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Previous paint colors", exact: true })
    .click();
  expect(
    await page
      .locator(".paint-tubes")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  const paper = page.getByLabel("Infinite painting paper", { exact: true });
  const rect = (await paper.boundingBox())!;
  await page.mouse.move(rect.x + rect.width * 0.7, rect.y + rect.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.8, rect.y + rect.height * 0.7, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "Undo paint stroke", exact: true }),
  ).toBeEnabled();
  await page.setViewportSize({ width: 800, height: 768 });
  await page.getByRole("switch", { name: "Art theme" }).click();
  expect(
    await tray.evaluate((el) => el.getBoundingClientRect().right <= innerWidth),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Undo paint stroke", exact: true }),
  ).toBeEnabled();
});

for (const [platform, userAgent, family] of [
  [
    "Mac",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
    "system-ui",
  ],
  [
    "Windows",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
    "Google Sans Flex Variable",
  ],
  [
    "Android",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36",
    "Google Sans Flex Variable",
  ],
]) {
  test(`${platform} uses the requested font in both UI themes`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ userAgent });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:3000/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page
        .locator("body")
        .evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain(family);
    await page.getByRole("switch", { name: "Art theme" }).click();
    expect(
      await page
        .locator(".workspace-heading h1")
        .evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain(family);
    if (platform !== "Mac")
      expect(
        await page.evaluate(() =>
          document.fonts.check('12px "Google Sans Flex Variable"'),
        ),
      ).toBe(true);
    await context.close();
  });
}
