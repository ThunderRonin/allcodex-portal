import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  snapshotDir: "./tests/snapshots",
  timeout: 30_000,
  fullyParallel: true,
  workers: 1,
  retries: 0,
  outputDir: "tests/test-results/artifacts",
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      // Snapshot name pattern: <test-title>-<platform>/<browser>/<test-title>.png
      // e.g. tests/snapshots/chromium/visual-lore-list.png
    },
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    cwd: __dirname,
    timeout: 120_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
