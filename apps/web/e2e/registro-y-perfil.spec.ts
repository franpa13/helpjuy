import { expect, test } from '@playwright/test';

test('registro → alta de perfil → aparece en el panel', async ({ page }) => {
  await page.goto('/registro');
  await page.getByLabel('Email').fill(`e2e+${Date.now()}@mail.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page).toHaveURL(/\/panel\/perfiles\/nuevo/);
  await page.getByLabel('Nombre').fill('Juan');
  await page.getByLabel('Apellido').fill('Pérez');
  await page.getByRole('button', { name: 'Seguir' }).click();

  const accept = page.getByRole('button', { name: 'Aceptar y crear perfil' });
  await expect(accept).toBeDisabled();
  await page.getByRole('checkbox', { name: /Leí y acepto/ }).check();
  await accept.click();

  // Después de crear el perfil va directo al editor de la ficha
  await expect(page).toHaveURL(/\/panel\/perfiles\/[\w-]+$/);
  await page.goto('/panel');
  await expect(page.getByText('Juan Pérez')).toBeVisible();
  await expect(page.getByText('Falta un contacto de emergencia')).toBeVisible();
  await expect(page.getByText('Confirmá tu email para recibir avisos')).toBeVisible();
});

test('sin sesión el panel redirige a ingresar', async ({ page }) => {
  await page.goto('/panel');
  await expect(page).toHaveURL(/\/ingresar\?next=%2Fpanel/);
});
