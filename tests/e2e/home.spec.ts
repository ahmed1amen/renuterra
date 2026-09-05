import { expect, test } from "@playwright/test";

test("home shows the app launcher with search", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");
  await expect(page.getByText("Here are your applications.")).toBeVisible();
  await expect(main.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Styleguide" })).toBeVisible();

  // Search filters the grid.
  await page.getByLabel("Search apps").fill("crm");
  await expect(
    main.getByRole("button", { name: "CRM", exact: true }),
  ).toBeVisible();
  await expect(main.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
});

test("dashboard renders KPIs from mock data", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Pipeline value")).toBeVisible();
  await expect(page.getByText("Pipeline by stage")).toBeVisible();
});
