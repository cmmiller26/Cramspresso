import { test, expect } from "@playwright/test";

test.describe("Unauthenticated User Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("redirects to sign-in when accessing protected route", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/sign-in", { timeout: 10000 });
  });
});
