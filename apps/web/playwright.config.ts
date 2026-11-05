import { defineConfig, devices } from '@playwright/test';

const TEST_DB = 'postgresql://helpjuy:helpjuy@localhost:5433/helpjuy_test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: [
    {
      command: 'pnpm --filter api db:deploy && pnpm --filter api start',
      url: 'http://localhost:4000/health',
      env: { DATABASE_URL: TEST_DB, PORT: '4000', RESEND_API_KEY: '', NODE_ENV: 'test', PROXY_SECRET: 'e2e-secret' },
      reuseExistingServer: false,
      timeout: 120_000,
      cwd: '../..',
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      env: { API_URL: 'http://localhost:4000', PROXY_SECRET: 'e2e-secret' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
