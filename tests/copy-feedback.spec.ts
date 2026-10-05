import { openWorkspace } from "./open-workspace";
import { test, expect } from "@playwright/test";

test("copy actions use stable icon feedback without shifting layout", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openWorkspace(page);
  await page
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create Palette",
    exact: true,
  });
  await dialog.getByLabel("Palette name").fill("Blue");
  await dialog.getByLabel("Anchor", { exact: true }).fill("#2679f3");
  await dialog
    .getByRole("button", { name: "Create Palette", exact: true })
    .click();
  async function checkCopy(button: ReturnType<typeof page.getByRole>) {
    const before = await button.boundingBox();
    const mainBefore = await page.locator("main.view").boundingBox();
    const feedback = await page.locator(".workspace-feedback").textContent();
    await button.click();
    await expect(button).toHaveAttribute("data-copied", "true");
    const after = await button.boundingBox();
    expect(after).toEqual(before);
    expect(await page.locator("main.view").boundingBox()).toEqual(mainBefore);
    expect(await page.locator(".workspace-feedback").textContent()).toBe(
      feedback,
    );
    await expect(button.locator(".copy-status-check")).toHaveCSS(
      "opacity",
      "1",
    );
    expect(
      await button.locator(".copy-status-check").evaluate((el) => {
        const probe = document.createElement("span");
        probe.style.color = "var(--green-600)";
        document.body.append(probe);
        const same =
          getComputedStyle(el).color === getComputedStyle(probe).color;
        probe.remove();
        return same;
      }),
    ).toBe(true);
  }
  await checkCopy(
    page.getByRole("button", { name: "Copy Blue for app", exact: true }),
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "--blue-500:",
  );
  await page
    .getByRole("button", { name: "Inspect blue-500", exact: true })
    .click();
  await checkCopy(
    page.getByRole("button", { name: "Copy HEX: #2679f3", exact: true }),
  );
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Tokens", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create tokens", exact: true })
    .click();
  await page.getByRole("tab", { name: "Integrate", exact: true }).click();
  await checkCopy(
    page.getByRole("button", { name: "Copy integration prompt", exact: true }),
  );
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Export", exact: true })
    .click();
  await checkCopy(page.getByRole("button", { name: "Copy", exact: true }));
  await page.keyboard.press("Control+k");
  await page
    .getByRole("combobox", { name: "Search commands", exact: true })
    .fill("Copy CSS");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Command menu", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Copy CSS variables", exact: true }),
  ).toHaveAttribute("data-copied", "true");
});

test("failed clipboard writes never show a success check or add layout feedback", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    }),
  );
  await openWorkspace(page);
  await page.getByRole("button", { name: "Add color", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add color", exact: true });
  await dialog.getByLabel("Color", { exact: true }).fill("#666880");
  await dialog.getByRole("button", { name: "Add color", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("button", { name: "Source", exact: true })
    .click();
  await page.locator(".source-swatch").first().click();
  const button = page.getByRole("button", {
    name: "Copy HEX: #666880",
    exact: true,
  });
  const feedback = await page.locator(".workspace-feedback").textContent();
  await button.click();
  await expect(button).toHaveAttribute(
    "title",
    "Copy failed. Check clipboard permission.",
  );
  await expect(button).toHaveAttribute("data-copied", "false");
  expect(await page.locator(".workspace-feedback").textContent()).toBe(
    feedback,
  );
});
