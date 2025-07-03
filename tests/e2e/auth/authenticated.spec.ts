import { clerk } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test.describe("Authenticated User Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });
    // Wait for sign-in to complete before navigating
    await page.waitForTimeout(1000);
    await page.goto("/dashboard", { waitUntil: "networkidle" });
  });

  test("can access dashboard when authenticated", async ({ page }) => {
    await expect(page).toHaveTitle("Dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("can sign out and be redirected to home", async ({ page }) => {
    await clerk.signOut({ page });
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page).toHaveURL("/");

    // Wait for sign-out to complete before navigating
    await page.waitForTimeout(1000);

    // Verify actually signed out - use simpler navigation
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/sign-in", { timeout: 10000 });
  });
});
