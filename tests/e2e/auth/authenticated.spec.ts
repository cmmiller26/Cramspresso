import { clerk } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test.describe("Authenticated User Flow", () => {
  test("can access dashboard when authenticated", async ({ page }) => {
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

    await page.goto("/dashboard");
    await expect(page).toHaveTitle("Dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("can sign out and lose dashboard access", async ({ page }) => {
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

    await clerk.signOut({ page });
    await expect(page).toHaveURL("/");

    await page.goto("/dashboard");
    await expect(page).toHaveURL("/sign-in", { timeout: 10000 });
  });
});
