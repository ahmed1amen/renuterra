import { expect, test } from "@playwright/test";

test("home page renders the app shell", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Renuterra", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
});
