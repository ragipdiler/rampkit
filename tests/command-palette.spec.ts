import { test, expect } from "@playwright/test";

test("command palette search, keyboard selection, empty results and action execution", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const menu = page.getByRole("dialog", { name: "Command menu", exact: true });
  const search = menu.getByRole("combobox", { name: "Search commands" });
  await expect(search).toBeFocused();
  await expect(menu).toHaveCSS("border-radius", "24px");
  await expect(menu).toContainText(
    "Build an OKLCH scale around the colors you choose.",
  );
  await expect(
    menu.getByRole("option", { name: /Analyze website/ }),
  ).toBeEnabled();
  await page.screenshot({
    path: "docs/design/screenshots/command-palette.png",
  });
  await search.fill("no-such-command");
  await expect(menu.getByRole("status")).toContainText("No commands found");
  await search.fill("Copy CSS");
  await expect(menu.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  await search.fill("");
  await page.keyboard.press("ArrowDown");
  await expect(
    menu.getByRole("option", { name: /^Add color/ }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(menu).not.toBeVisible();
  const manual = page.getByRole("dialog", { name: "Add color", exact: true });
  await expect(manual).toBeVisible();
  await manual.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.keyboard.press("Control+k");
  await expect(menu).toBeVisible();
  await search.fill("accessibility");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Contrast", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await page.keyboard.press("End");
  await expect(
    menu.getByRole("option", { name: /Open Canvas/ }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Contrast", exact: true }),
  ).toBeVisible();
  let analyses = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/analyze")) analyses++;
  });
  await page.keyboard.press("Control+k");
  await search.fill("Analyze website");
  await page.keyboard.press("Enter");
  await expect(menu).not.toBeVisible();
  const url = page.getByRole("textbox", { name: "Website URL" });
  await expect(url).toBeFocused();
  await url.fill("http://127.0.0.1:3987");
  await page.keyboard.press("Control+k");
  await search.fill("Analyze website");
  await page.keyboard.press("Enter");
  await expect(url).toBeFocused();
  await expect(url).toHaveValue("http://127.0.0.1:3987");
  expect(analyses).toBe(0);
  await page.keyboard.press("Enter");
  await expect(page.locator(".source-swatch").first()).toBeVisible({
    timeout: 55000,
  });
  expect(analyses).toBe(1);
});
