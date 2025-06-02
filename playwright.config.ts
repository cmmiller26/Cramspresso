import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  globalSetup: path.join(__dirname, "playwright", "global.setup.ts"),
  use: {
    storageState: path.join(__dirname, "playwright", ".clerk", "user.json"),
    headless: true,
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
