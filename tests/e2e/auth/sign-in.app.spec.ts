import { clerk } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Sign-In Flow (Public)", () => {
  test("redirects unauthenticated user, then allows sign-in to reach dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/sign-in");

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
  });
});
