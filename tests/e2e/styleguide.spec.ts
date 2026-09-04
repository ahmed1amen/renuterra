import { expect, type Page, test } from "@playwright/test";

function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test("styleguide defaults to the brand section", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(
    page.getByRole("heading", { name: "Brand", level: 2 }),
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

test("every section renders without console errors", async ({ page }) => {
  await page.goto("/styleguide");
  const hrefs = await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((l) => new URL((l as HTMLAnchorElement).href).pathname),
    );
  expect(hrefs.length).toBeGreaterThan(0);

  for (const href of hrefs) {
    const errors = watchConsole(page);
    await page.goto(href);
    await expect(
      page.getByRole("main").getByRole("heading", { level: 2 }).first(),
      href,
    ).toBeVisible();
    expect(errors, `${href} console`).toEqual([]);
  }
});

test("sample screens switch views", async ({ page }) => {
  await page.goto("/styleguide/screens");
  await expect(page.getByText("Good morning, Sara")).toBeVisible();
  await page.getByRole("button", { name: "Quote detail" }).click();
  await expect(page.getByText("Line items")).toBeVisible();
});

test("unknown section 404s", async ({ page }) => {
  const response = await page.goto("/styleguide/does-not-exist");
  expect(response?.status()).toBe(404);
});
