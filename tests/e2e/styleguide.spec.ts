import { expect, test } from "@playwright/test";

test("styleguide defaults to the overview section", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(
    page.getByRole("heading", { name: "Overview", level: 2 }),
  ).toBeVisible();
});

test("sidebar navigates between sections", async ({ page }) => {
  await page.goto("/styleguide");
  await page.getByRole("link", { name: "Buttons" }).click();
  await expect(page).toHaveURL(/\/styleguide\/buttons$/);
  await expect(
    page.getByRole("heading", { name: "Buttons", level: 2 }),
  ).toBeVisible();
});

test("search filters the section list", async ({ page }) => {
  await page.goto("/styleguide");
  await page.getByRole("searchbox", { name: "Search components" }).fill("form");
  await expect(page.getByRole("link", { name: "Forms" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cards" })).toBeHidden();
});

test("unknown section 404s", async ({ page }) => {
  const response = await page.goto("/styleguide/does-not-exist");
  expect(response?.status()).toBe(404);
});
