import { defineConfig } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT || '5173';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 1100 },
    trace: 'retain-on-failure',
  },
  webServer: { command: `npm run dev -- --port ${port} --strictPort`, url: baseURL, reuseExistingServer: !process.env.PLAYWRIGHT_PORT },
});
