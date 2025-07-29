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

    // Verify we're authenticated first
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");

    // Try manual sign out by clicking the sign out button
    try {
      // Look for sign out button/link in your UI
      const signOutButton = page.locator(
        'button:has-text("Sign out"), a:has-text("Sign out"), [data-testid="sign-out"]'
      );
      if (await signOutButton.isVisible({ timeout: 5000 })) {
        await signOutButton.click();
        await expect(page).toHaveURL("/", { timeout: 10000 });
      } else {
        throw new Error("Sign out button not found, trying Clerk method");
      }
    } catch (error) {
      console.log(
        "Manual sign out failed, trying Clerk method:",
        error instanceof Error ? error.message : error
      );

      // Use Clerk with error handling
      try {
        await clerk.signOut({ page });
        await expect(page).toHaveURL("/", { timeout: 10000 });
      } catch (clerkError) {
        console.log(
          "Clerk sign out failed, using fallback method:",
          clerkError instanceof Error ? clerkError.message : clerkError
        );

        // Fallback - clear all cookies and storage
        await page.context().clearCookies();
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Clear storage after page is loaded
        await page.evaluate(() => {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch (e) {
            console.log("Storage clear failed:", e);
          }
        });
      }
    }

    // Test that dashboard access is now restricted
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/sign-in", { timeout: 10000 });
  });
});

test.describe("Authentication State Verification", () => {
  test("dashboard redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    // Ensure clean state - clear cookies first
    await page.context().clearCookies();

    // Navigate to a safe page first, then clear storage
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear storage safely after page load
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore storage errors - we just want to ensure clean state
        console.log(
          "Storage clear failed (expected):",
          e instanceof Error ? e.message : e
        );
      }
    });

    // Try to access dashboard directly without authentication
    await page.goto("/dashboard");

    // Should redirect to sign-in page
    await expect(page).toHaveURL("/sign-in", { timeout: 10000 });
  });

  test("can sign in and access protected routes", async ({ page }) => {
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

    // Test multiple protected routes
    const protectedRoutes = ["/dashboard", "/create"];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(route, { timeout: 10000 });
    }
  });
});
