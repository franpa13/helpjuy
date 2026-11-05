import { expect, test } from '@playwright/test';

test('cargar la ficha, verla como paramédico y ocultar una sección', async ({ page, context }) => {
  // Registro y alta de perfil
  await page.goto('/registro');
  await page.getByLabel('Email').fill(`ficha+${Date.now()}@mail.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Nombre').fill('Lucía');
  await page.getByLabel('Apellido').fill('Mamani');
  await page.getByRole('button', { name: 'Seguir' }).click();
  await page.getByRole('checkbox', { name: /Leí y acepto/ }).check();
  await page.getByRole('button', { name: 'Aceptar y crear perfil' }).click();

  // Editor de la ficha
  await expect(page).toHaveURL(/\/panel\/perfiles\/[\w-]+$/);
  await page.getByRole('button', { name: 'Agregar alergia' }).click();
  await page.getByLabel('Alergia 1').fill('Penicilina');
  await page.getByRole('button', { name: 'Agregar remedio' }).click();
  await page.getByLabel('Remedio 1').fill('Warfarina');
  await page.getByRole('button', { name: 'Agregar contacto' }).click();
  await page.getByLabel('Nombre del contacto 1').fill('Jorge');
  await page.getByLabel('Teléfono del contacto 1').fill('388 412-3456');
  await page.getByRole('button', { name: 'Guardar ficha' }).click();
  await expect(page.getByText('Guardado. Tu QR ya muestra estos datos.')).toBeVisible();

  const href = await page.getByRole('link', { name: 'Ver como el paramédico' }).getAttribute('href');
  expect(href).toMatch(/^\/e\/[A-Za-z0-9_-]{22}$/);

  // Ficha pública, sin sesión
  const visitor = await context.browser()!.newContext({ baseURL: 'http://localhost:3100' });
  const card = await visitor.newPage();
  await card.goto(href!);
  await expect(card.getByRole('region', { name: 'Alergias' })).toContainText('Penicilina');
  await expect(card.getByText('Warfarina')).toBeVisible();
  await expect(card.getByRole('link', { name: /Jorge/ }).first()).toHaveAttribute('href', 'tel:3884123456');

  // Ocultar la medicación y confirmar que desaparece de la ficha pública
  await page.getByRole('switch', { name: /Medicación.*Mostrar en mi QR/ }).click();
  await page.getByRole('button', { name: 'Guardar ficha' }).click();
  await expect(page.getByText('Guardado. Tu QR ya muestra estos datos.')).toBeVisible();
  await expect
    .poll(async () => {
      await card.reload();
      return card.getByText('Warfarina').count();
    })
    .toBe(0);
  await expect(card.getByRole('region', { name: 'Alergias' })).toContainText('Penicilina');
  await visitor.close();
});

test('un token que no existe muestra la página de ficha no encontrada', async ({ page }) => {
  await page.goto('/e/AAAAAAAAAAAAAAAAAAAAAA');
  await expect(page.getByText('Este código no corresponde a ninguna ficha activa')).toBeVisible();
  await expect(page.getByRole('link', { name: /107/ })).toHaveAttribute('href', 'tel:107');
});
