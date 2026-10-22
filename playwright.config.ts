import { defineConfig, devices } from "@playwright/test";

const port = 3100;
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" } } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" } } },
  ],
  webServer: { command: `npx next start -p ${port}`, port, reuseExistingServer: true, timeout: 60_000 },
});
