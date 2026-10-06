import { test, expect } from "@playwright/test";

test("installation copies exact commands without changing its label or size", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("https://api.github.com/repos/ragipdiler/rampkit", (route) =>
    route.fulfill({ json: { stargazers_count: 42 } }),
  );
  await page.goto("/");
  const button = page.getByRole("button", {
    name: "Copy installation commands",
  });
  await page.getByRole("radio", { name: "Lavender" }).focus();
  const before = await button.boundingBox();
  await button.click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(
      "git clone https://github.com/ragipdiler/rampkit.git\ncd rampkit\nnpm install\nnpx playwright install chromium",
    );
  await expect(button).toHaveText("Copy commands");
  const after = await button.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
  await page.getByRole("button", { name: "Copy launch command" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("npm run dev");
});

test("illustration supports keyboard choices and FAQ reveals accurate setup information", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://api.github.com/repos/ragipdiler/rampkit", (route) =>
    route.fulfill({ json: { stargazers_count: 42 } }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Rampkit on GitHub, 42 stars" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const lavender = page.getByRole("radio", { name: "Lavender" });
  await lavender.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Terracotta" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.locator(".palette-play").getByRole("status")).toContainText(
    "#d37861",
  );
  await page.getByText("Is there an online version of the studio?").click();
  await expect(page.locator("details[open]")).toContainText("local");
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`layout remains usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route(
      "https://api.github.com/repos/ragipdiler/rampkit",
      (route) => route.fulfill({ json: { stargazers_count: 42 } }),
    );
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy installation commands" }),
    ).toBeAttached();
    expect((await page.request.get("/social.png")).status()).toBe(200);
  });
}

for (const width of [390, 1440]) {
  test(`sticky navigation compacts and restores without shifting content at ${width}px`, async ({
    page,
  }) => {
    await page.route(
      "https://api.github.com/repos/ragipdiler/rampkit",
      (route) => route.fulfill({ json: { stargazers_count: 42 } }),
    );
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const frame = page.locator(".site-header-frame");
    const header = frame.locator("header");
    const originalTop = await page
      .locator("#features")
      .evaluate((el) => (el as HTMLElement).offsetTop);
    await page.evaluate(() =>
      window.scrollTo({ top: 1500, behavior: "instant" }),
    );
    await expect(frame).toHaveAttribute("data-compact", "true");
    await expect
      .poll(async () => (await header.boundingBox())?.height)
      .toBe(44);
    const box = await header.boundingBox();
    expect(box!.y).toBeCloseTo(12);
    expect(await header.evaluate((el) => getComputedStyle(el).padding)).toBe(
      "4px",
    );
    expect(
      await page
        .locator("#features")
        .evaluate((el) => (el as HTMLElement).offsetTop),
    ).toBe(originalTop);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440) {
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "How it works" })
        .click();
      await expect
        .poll(async () => (await page.locator("#workflow").boundingBox())!.y)
        .toBeCloseTo(96, 0);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(frame).toHaveAttribute("data-compact", "false");
    await expect
      .poll(async () => (await header.boundingBox())?.height)
      .toBe(width < 800 ? 80 : 96);
  });
}
