import { expect, test, type Page } from '@playwright/test';
import { deleteUser } from './helpers/db';

const ADMIN = 'admin@helpjuy.e2e.example'; // está en ADMIN_EMAILS (playwright.config.ts)

async function register(page: Page, email: string) {
  await page.goto('/registro');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/panel\/perfiles\/nuevo/);
}

test('el admin ve las métricas; el resto, "no encontrada"', async ({ page, browser }) => {
  await deleteUser(ADMIN);
  await register(page, ADMIN);
  await page.goto('/panel/metricas');
  await expect(page.getByRole('heading', { name: 'Métricas', level: 1 })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Embudo' }).getByRole('listitem')).toHaveCount(5);
  await expect(page.getByRole('table', { name: 'Por semana' })).toBeVisible();
  await page.screenshot({ path: 'test-results/metricas.png', fullPage: true });

  const other = await (await browser.newContext({ baseURL: 'http://localhost:3100' })).newPage();
  await register(other, `comun+${Date.now()}@mail.com`);
  const res = await other.goto('/panel/metricas');
  expect(res?.status()).toBe(404);
});
