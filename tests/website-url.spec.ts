import { test, expect } from "@playwright/test";
import { openWorkspace } from "./open-workspace";

test("website input defaults to HTTPS, accepts bare domains and preserves complete pasted URLs", async ({
  page,
}) => {
  await openWorkspace(page);
  const input = page.getByRole("textbox", { name: "Website URL" });
  await expect(input).toHaveValue("https://");
  let submitted = "";
  await page.route("**/api/analyze", async (route) => {
    submitted = route.request().postDataJSON().url;
    await route.fulfill({
      status: 400,
      json: { error: "Synthetic URL check" },
    });
  });
  await input.fill("example.com/study");
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Synthetic URL check" }),
  ).toContainText("Synthetic URL check");
  expect(submitted).toBe("https://example.com/study");
  await expect(input).toHaveValue("https://example.com/study");
  await input.fill("http://127.0.0.1:3987");
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect.poll(() => submitted).toBe("http://127.0.0.1:3987");
  await input.fill("https://");
  await input.evaluate((element) => {
    const data = new DataTransfer();
    data.setData("text", "https://example.com/full-url");
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(input).toHaveValue("https://example.com/full-url");
});
