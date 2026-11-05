import 'dotenv/config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    fileParallelism: false,
    globalSetup: ['./test/global-setup.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? '',
      NODE_ENV: 'test',
      WEB_URL: 'http://localhost:3000',
      RESEND_API_KEY: '',
    },
  },
});
