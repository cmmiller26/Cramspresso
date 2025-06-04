import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import path from "path";

setup("global setup", async ({}) => {
  await clerkSetup();
});

const authFile = path.resolve(__dirname, "./.clerk/user.json");

setup("authenticate and save state to storage", async ({ page }) => {
  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });
  await page.context().storageState({ path: authFile });
});
