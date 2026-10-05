import { expect, type Page } from "@playwright/test";

/** Wait for the client-mounted toolbar before interacting with server-rendered controls. */
export async function openWorkspace(page: Page, url = "/") {
  await page.goto(url);
  await expect(
    page.locator(".workspace-tabs-slot").getByRole("tablist", {
      name: "Palette sections",
      exact: true,
    }),
  ).toBeVisible();
}
