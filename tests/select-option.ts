import type { Locator } from "@playwright/test";

/** Choose through the visible dropdown, including menus inside native dialogs. */
export async function chooseOption(trigger: Locator, value: string) {
  if ((await trigger.getAttribute("role")) === "radiogroup") {
    await trigger
      .getByRole("radio", {
        name: value === "dark" ? "Dark" : "Light",
        exact: true,
      })
      .click();
    return;
  }
  await trigger.click();
  const options = trigger.page().getByRole("option");
  const byValue = options.locator(`xpath=self::*[@data-value='${value}']`);
  if (await byValue.count()) await byValue.click();
  else await trigger.page().getByRole("option", { name: value, exact: true }).click();
}
