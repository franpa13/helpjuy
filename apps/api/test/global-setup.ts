import 'dotenv/config';
import { execSync } from 'node:child_process';

export default function setup() {
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  });
}
