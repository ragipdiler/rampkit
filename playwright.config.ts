import { defineConfig } from "@playwright/test";
const testPort = Number(process.env.RAMPKIT_TEST_PORT ?? 3000);
const testUrl = `http://127.0.0.1:${testPort}`;
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  testIgnore: "landing.spec.ts",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: testUrl,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: `npm run dev -- --port ${testPort}`,
      url: testUrl,
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: "node scripts/fixture-server.mjs",
      url: "http://127.0.0.1:3987",
      reuseExistingServer: true,
    },
  ],
});
