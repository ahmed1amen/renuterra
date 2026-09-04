import { expect, type Page, test } from "@playwright/test";

/** Collect console errors and uncaught exceptions for the life of the page. */
function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test("index lists every registered prototype", async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto("/prototypes");

  await expect(
    page.getByRole("heading", { name: "All prototypes", level: 2 }),
  ).toBeVisible();

  const cards = page.getByRole("main").getByRole("link");
  expect(await cards.count()).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("every registered prototype renders without console errors", async ({
  page,
}) => {
  await page.goto("/prototypes");
  const hrefs = await page
    .getByRole("main")
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((l) => new URL((l as HTMLAnchorElement).href).pathname),
    );
  expect(hrefs.length).toBeGreaterThan(0);

  for (const href of hrefs) {
    const errors = watchConsole(page);
    await page.goto(href);

    const frame = page.getByTestId("phone-frame");
    await expect(frame, href).toBeVisible();
    // Wait for the mock fetch to settle so async render errors are caught too.
    await expect(frame.locator("[aria-busy]"), href).toHaveCount(0, {
      timeout: 10_000,
    });
    expect(errors, `${href} console`).toEqual([]);
  }
});

test("viewport switcher persists the device in the URL", async ({ page }) => {
  await page.goto("/prototypes/lead-list");
  await page.getByRole("button", { name: "Android" }).click();
  await expect(page).toHaveURL(/device=android/);
  await expect(page.getByTestId("phone-frame")).toHaveAttribute(
    "data-device",
    "android",
  );

  await page.getByRole("button", { name: "Bare" }).click();
  await expect(page).toHaveURL(/device=bare/);

  await page.getByRole("button", { name: "iPhone" }).click();
  await expect(page).not.toHaveURL(/device=/);
});

test("scenario switcher shows the empty state", async ({ page }) => {
  await page.goto("/prototypes/lead-list?scenario=empty");
  await expect(page.getByText("No leads yet")).toBeVisible();
});

test("unknown prototype 404s", async ({ page }) => {
  const response = await page.goto("/prototypes/does-not-exist");
  expect(response?.status()).toBe(404);
});
