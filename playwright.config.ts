import './server/browser-path';
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests', testMatch: ['*.spec.ts'], timeout: 75_000, retries: 0, workers: 1,
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4204', viewport: {width: 1440, height: 810}, video: 'on', screenshot: 'on', trace:'off' },
  webServer: [
    { command: 'npm run dev:api', url: 'http://127.0.0.1:5204/api/health', reuseExistingServer: false, timeout: 60_000 },
    { command: 'npm run dev:web', url: 'http://127.0.0.1:4204', reuseExistingServer: false, timeout: 60_000 },
  ],
  outputDir: process.env.BUGCAM_DEMO ? 'artifacts/playwright/demo' : 'artifacts/playwright/e2e', reporter: [['list']],
});
