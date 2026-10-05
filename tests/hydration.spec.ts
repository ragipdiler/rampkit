import { test, expect } from "@playwright/test";
import { openWorkspace } from "./open-workspace";

test("palette controls work after slow client hydration", async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.route("**/_next/**/*.js*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await openWorkspace(page);
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Create Palette", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Anchor", { exact: true }).fill("#2679f3");
  await expect(dialog.getByLabel("Palette name", { exact: true })).toHaveValue(
    "Blue",
  );
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Blue palette", exact: true }),
  ).toBeVisible();
});
