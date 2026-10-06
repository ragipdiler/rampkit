import { openWorkspace } from "./open-workspace";
import { test, expect } from "@playwright/test";
import { chooseOption } from "./select-option";

test("dashboard previews use real tokens without saving temporary mappings", async ({
  page,
}) => {
  await openWorkspace(page);
  const nav = page.getByRole("navigation", { name: "Workspace" });
  await nav.getByRole("button", { name: "Tokens", exact: true }).click();
  await expect(
    page.getByText(
      "Create tokens to map your system and preview your colors on dashboard components.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Preview", exact: true }),
  ).toHaveCount(0);
  await nav.getByRole("button", { name: "Palettes", exact: true }).click();
  for (const color of ["#2679f3", "#ef5b35"]) {
    await page
      .getByRole("button", { name: "Create Palette", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Create Palette",
      exact: true,
    });
    await dialog.getByLabel("Anchor", { exact: true }).fill(color);
    await dialog
      .getByRole("button", { name: "Create Palette", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  await nav.getByRole("button", { name: "Tokens", exact: true }).click();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  const dashboard = page.getByRole("region", {
    name: "Dashboard token preview",
  });
  await expect(
    page
      .getByRole("tablist", { name: "Preview color source" })
      .getByRole("tab", { name: "Semantic mappings", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByLabel("Preview map border-primary", { exact: true }),
  ).toHaveAttribute("data-value", "");
  await page
    .getByRole("tablist", { name: "Preview color source" })
    .getByRole("tab", { name: "Palette study", exact: true })
    .click();
  await expect(dashboard).toBeVisible();
  await expect(page.getByLabel("Preview token references")).toContainText(
    "blue-600",
  );
  const initial = await dashboard.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await page
    .getByRole("button", { name: "Invite member", exact: true })
    .click();
  await expect(dashboard).toContainText(
    "Sample invitation added. No invitation was sent.",
  );
  await expect(dashboard).toContainText("9");
  await chooseOption(
    page.getByLabel("Preview palette", { exact: true }),
    "orange",
  );
  await expect(page.getByLabel("Preview token references")).toContainText(
    "orange-600",
  );
  expect(
    await dashboard.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(initial);
  const orangeLight = await dashboard.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  expect(
    await dashboard.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(orangeLight);
  await expect(page.getByLabel("Preview token references")).toContainText(
    "orange-300",
  );
  await page.getByRole("radio", { name: "Light", exact: true }).click();
  await page
    .getByRole("tablist", { name: "Preview color source" })
    .getByRole("tab", { name: "Semantic mappings", exact: true })
    .click();
  await expect(dashboard).toHaveCount(0);
  await expect(
    page.getByText("Map colors to preview your dashboard"),
  ).toBeVisible();
  await page.getByRole("button", { name: "All semantic mappings" }).click();
  await expect(
    page.getByLabel("Map text-primary", { exact: true }),
  ).toHaveAttribute("data-value", "");
  const values = {
    "background-primary": "blue-50",
    "surface-primary": "blue-25",
    "text-primary": "blue-950",
    "text-secondary": "blue-700",
    "border-primary": "blue-200",
    "action-primary": "blue-600",
    "action-primary-foreground": "blue-25",
  };
  for (const [role, token] of Object.entries(values))
    await chooseOption(page.getByLabel(`Map ${role}`, { exact: true }), token);
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await page
    .getByRole("tablist", { name: "Preview color source" })
    .getByRole("tab", { name: "Semantic mappings", exact: true })
    .click();
  await expect(dashboard).toBeVisible();
  const editor = page.getByRole("region", {
    name: "Preview semantic mappings",
    exact: true,
  });
  await expect(editor.locator(".preview-token-group")).toHaveCount(10);
  const initialPosition = await dashboard.boundingBox();
  await editor.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(dashboard).toBeInViewport();
  expect((await dashboard.boundingBox())!.y).toBe(initialPosition!.y);
  const border = page.getByLabel("Preview map border-primary", { exact: true });
  const card = dashboard.locator(".preview-card").first();
  const originalBorder = await card.evaluate(
    (el) => getComputedStyle(el).borderColor,
  );
  await chooseOption(border, "blue-400");
  expect(
    await card.evaluate((el) => getComputedStyle(el).borderColor),
  ).not.toBe(originalBorder);
  await chooseOption(border, "blue-100");
  await expect(border).toHaveAttribute("data-value", "blue-100");
  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  await expect(border).toHaveAttribute("data-value", "");
  await chooseOption(border, "blue-700");
  await page.getByRole("radio", { name: "Light", exact: true }).click();
  await expect(border).toHaveAttribute("data-value", "blue-100");
  await page.getByRole("button", { name: "All semantic mappings" }).click();
  await expect(
    page.getByLabel("Map border-primary", { exact: true }),
  ).toHaveAttribute("data-value", "blue-100");
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(
    page.getByLabel("Preview map border-primary", { exact: true }),
  ).toHaveAttribute("data-value", "blue-100");
  const saved = await dashboard.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await page.getByRole("switch", { name: "Art theme" }).click();
  expect(
    await dashboard.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe(saved);
  await expect(page.getByLabel("Preview contrast checks")).toContainText("AA");
  await page.screenshot({
    path: "docs/design/screenshots/token-dashboard-preview.png",
  });
  await page.setViewportSize({ width: 1024, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await nav.getByRole("button", { name: "Export", exact: true }).click();
  await chooseOption(page.getByLabel("Export format"), "json");
  await expect(page.getByLabel("Export preview")).toContainText("blue-950");
});

test("every semantic role has a specimen, status and secondary states use exact mapped colors", async ({
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
  await dialog.getByLabel("Anchor", { exact: true }).fill("#2679f3");
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  const examples = page.getByRole("region", {
    name: "All semantic token examples",
  });
  await expect(examples.locator(".sample-references > div")).toHaveCount(28);
  await expect(examples).toContainText("Unresolved");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const warningPicker = page.getByRole("combobox", { name: "Preview map warning", exact: true });
  await warningPicker.click();
  await page
    .getByRole("region", { name: "Live token preview", exact: true })
    .evaluate(
      (element) =>
        new Promise<void>((resolve) => {
          element.addEventListener(
            "scroll",
            () => requestAnimationFrame(() => resolve()),
            { once: true },
          );
          element.scrollTop += 100;
        }),
    );
  await expect(warningPicker).toHaveAttribute("aria-expanded", "true");
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(warningPicker).toHaveAttribute("aria-expanded", "false");
  expect(errors).toEqual([]);

  for (const [role, value] of Object.entries({
    warning: "blue-600",
    "warning-foreground": "blue-25",
    "action-secondary": "blue-100",
    "action-secondary-hover": "blue-200",
    "action-secondary-active": "blue-300",
    "action-secondary-foreground": "blue-950",
  }))
    await chooseOption(
      page.getByLabel(`Preview map ${role}`, { exact: true }),
      value,
    );
  const warning = examples.locator(
    'article[aria-label="Warning notification"] .sample-notification',
  );
  await expect(warning).toContainText("Some changes need your review.");
  const original = await warning.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await chooseOption(
    page.getByLabel("Preview map warning", { exact: true }),
    "blue-500",
  );
  await expect(warning).toBeInViewport();
  expect(
    await warning.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).not.toBe(original);
  await expect(
    examples.locator('article[aria-label="Secondary button"] .sample-button'),
  ).toHaveCount(3);
  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  await expect(warning.locator("xpath=..")).toHaveAttribute(
    "data-mapped",
    "false",
  );
  await page.getByRole("radio", { name: "Light", exact: true }).click();
  await expect(warning).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileEditor = await page
    .getByRole("region", { name: "Preview semantic mappings", exact: true })
    .boundingBox();
  const mobilePreview = await page
    .getByRole("region", { name: "Live token preview", exact: true })
    .boundingBox();
  expect(mobilePreview!.y).toBeLessThan(mobileEditor!.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
