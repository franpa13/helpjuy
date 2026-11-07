import { expect, test } from '@playwright/test';

test('la web manda headers de seguridad', async ({ request }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).toContain("object-src 'none'");
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['strict-transport-security']).toContain('max-age=');
  expect(h['permissions-policy']).toContain('geolocation=(self)');
  expect(h['x-powered-by']).toBeUndefined();
});

test('ninguna pantalla choca con la política de contenido (CSP)', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(m.text())) violations.push(m.text());
  });

  await page.goto('/');
  await page.goto('/registro');
  await page.getByLabel('Email').fill(`csp+${Date.now()}@mail.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Nombre').fill('Lucía');
  await page.getByLabel('Apellido').fill('Mamani');
  await page.getByRole('button', { name: 'Seguir' }).click();
  await page.getByRole('checkbox', { name: /Leí y acepto/ }).check();
  await page.getByRole('button', { name: 'Aceptar y crear perfil' }).click();
  await expect(page).toHaveURL(/\/panel\/perfiles\/[0-9a-f-]{36}$/);
  const href = await page.getByRole('link', { name: 'Ver como el paramédico' }).getAttribute('href');
  await page.goto(href!);
  await expect(page.getByRole('heading', { name: 'Lucía Mamani' })).toBeVisible();
  await page.goto('/panel/avisos');
  await page.goto('/panel/familia');

  expect(violations).toEqual([]);
});
