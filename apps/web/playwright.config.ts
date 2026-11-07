import { defineConfig, devices } from '@playwright/test';

const TEST_DB = 'postgresql://helpjuy:helpjuy@localhost:5433/helpjuy_test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: [
    {
      command: 'pnpm --filter api db:deploy && pnpm --filter api start',
      url: 'http://localhost:4100/health',
      env: { DATABASE_URL: TEST_DB, PORT: '4100', RESEND_API_KEY: '', NODE_ENV: 'test', PROXY_SECRET: 'e2e-secret', WEB_URL: 'http://localhost:3100', REVALIDATE_SECRET: 'e2e-revalidate', AUTH_RATE_LIMIT: '200', MEDICAL_DATA_KEY: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=' },
      reuseExistingServer: false,
      timeout: 120_000,
      cwd: '../..',
    },
    {
      command: 'pnpm exec next build && pnpm exec next start -p 3100',
      url: 'http://localhost:3100',
      env: {
        API_URL: 'http://localhost:4100',
        PROXY_SECRET: 'e2e-secret',
        REVALIDATE_SECRET: 'e2e-revalidate',
        // Producción exige una URL pública https para el QR impreso
        SITE_URL: 'https://helpjuy.e2e.example',
      },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
