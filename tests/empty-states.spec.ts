import { test, expect } from "@playwright/test";

test("all empty illustrations are decorative and static with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const [name, variant] of [
    ["Source", "source"],
    ["Palettes", "palettes"],
    ["Tokens", "tokens"],
    ["Contrast", "contrast"],
    ["Export", "export"],
  ]) {
    await page
      .getByRole("navigation", { name: "Workspace" })
      .getByRole("button", { name, exact: true })
      .click();
    const illustration = page.locator(`.empty-illustration-${variant}`);
    await expect(illustration).toBeVisible();
    await expect(illustration).toHaveAttribute("aria-hidden", "true");
    await expect(illustration.locator(".empty-tone").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator(".workspace-counts")).toHaveCount(0);
  }
  const theme = page.getByRole("radiogroup", { name: "Token preview" });
  await expect(
    page.getByRole("combobox", { name: "Token preview" }),
  ).toHaveCount(0);
  const light = theme.getByRole("radio", { name: "Light", exact: true });
  const dark = theme.getByRole("radio", { name: "Dark", exact: true });
  await light.focus();
  await page.keyboard.press("ArrowRight");
  await expect(dark).toBeFocused();
  await expect(dark).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Home");
  await expect(light).toBeFocused();
  await expect(light).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "lab(100 0 0)",
  );
  await page.screenshot({ path: "docs/design/screenshots/theme-switcher.png" });
});

test("empty palette colors cycle smoothly without generating user data", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const colors = await page
    .locator(".empty-ramp .empty-tone")
    .evaluateAll((elements) =>
      elements.map((el) => {
        const animation = el.getAnimations()[0];
        animation.pause();
        animation.currentTime = 0;
        const before = getComputedStyle(el).backgroundColor;
        animation.currentTime = 16000;
        return {
          before,
          after: getComputedStyle(el).backgroundColor,
          duration: animation.effect!.getTiming().duration,
        };
      }),
    );
  expect(colors).toHaveLength(5);
  for (const color of colors) {
    expect(color.after).not.toBe(color.before);
    expect(color.duration).toBe(32000);
  }
  await expect(page.locator(".workspace-counts")).toHaveCount(0);
  await page.screenshot({
    path: "docs/design/screenshots/animated-empty-palette.png",
  });
});
