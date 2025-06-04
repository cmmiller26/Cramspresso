import { clerk } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test.describe("Sign-Out Flow (Authenticated)", () => {
  test("authenticated user can sign out and is redirected to home page", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveTitle("Dashboard");

    await clerk.signOut({ page });
    await expect(page).toHaveURL("/");
  });
});
