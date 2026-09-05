import { expect, type Page, test } from "@playwright/test";

/**
 * The review layer is env-driven: with no Supabase vars it must be invisible
 * and the app must behave as if it did not exist; with a configured project it
 * must let a reviewer pin a comment that survives a reload at the same
 * position. Each test detects the server's mode and skips the other case.
 */

async function commentingConfigured(page: Page) {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 }),
  ).toBeVisible();
  return (await page.getByTestId("comment-mode-toggle").count()) > 0;
}

test("without Supabase env vars the comment UI is absent and pages work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  test.skip(
    await commentingConfigured(page),
    "Supabase is configured in this environment",
  );

  await expect(page.getByTestId("comment-layer")).toHaveCount(0);

  // `c` must not activate anything.
  await page.keyboard.press("c");
  await expect(page.getByTestId("comment-layer")).toHaveCount(0);

  // The page stays fully interactive (dashboard action button fires a toast).
  await page.getByRole("button", { name: "New lead" }).click();
  await expect(page.getByText("Lead created — prototype only")).toBeVisible();

  expect(errors).toEqual([]);
});

test("with Supabase configured a comment persists across reload at the same position", async ({
  page,
}) => {
  test.skip(
    !(await commentingConfigured(page)),
    "Supabase is not configured in this environment (run the migration and set the env vars)",
  );

  const body = `E2E comment ${Date.now()}`;

  // Enter comment mode and drop a pin on the page.
  await page.getByTestId("comment-mode-toggle").click();
  const layer = page.getByTestId("comment-layer");
  await layer.click({ position: { x: 200, y: 300 } });

  // First comment in a fresh browser context asks for a display name.
  await page.getByLabel("New comment").fill(body);
  await page.getByRole("button", { name: "Comment", exact: true }).click();
  await page.getByLabel("Display name").fill("E2E Bot");
  await page.getByRole("button", { name: "Save name" }).click();

  const pin = page.locator("[data-comment-pin][id^='comment-pin-']").last();
  await expect(pin).toBeVisible();
  const before = await pin.evaluate((el) => ({
    left: (el as HTMLElement).style.left,
    top: (el as HTMLElement).style.top,
  }));

  // Reload: the pin must come back from the database at the same position.
  await page.reload();
  await page.getByTestId("comment-panel-toggle").click();
  const panel = page.getByRole("complementary", { name: "Comments" });
  await expect(panel.getByText(body)).toBeVisible();

  const pins = page.locator("[data-comment-pin][id^='comment-pin-']");
  const positions = await pins.evaluateAll((els) =>
    els.map((el) => ({
      left: (el as HTMLElement).style.left,
      top: (el as HTMLElement).style.top,
    })),
  );
  expect(positions).toContainEqual(before);

  // Clean up: delete the thread we created (author matches stored name).
  await panel.getByText(body).click();
  await expect(page.getByLabel("Reply")).toBeVisible();
  await page.getByLabel("Delete thread").click();
  await expect(page.getByText(body)).toHaveCount(0);
});
