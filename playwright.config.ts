import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "global setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "Main tests",
      testMatch: /.*app\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["global setup"],
    },
    {
      name: "Authenticated tests",
      testMatch: /.*auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./tests/e2e/.clerk/user.json",
      },
      dependencies: ["global setup"],
    },
  ],
});
