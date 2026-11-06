import { expect, test } from '@playwright/test';

test('imprimir el QR y aviso de reimprimir cuando cambia algo impreso', async ({ page }) => {
  // window.print en headless: lo reemplazamos para no abrir el diálogo
  await page.addInitScript(() => {
    (window as unknown as { __printed: number }).__printed = 0;
    window.print = () => {
      (window as unknown as { __printed: number }).__printed++;
    };
  });

  await page.goto('/registro');
  await page.getByLabel('Email').fill(`print+${Date.now()}@mail.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Nombre').fill('Lucía');
  await page.getByLabel('Apellido').fill('Mamani');
  await page.getByRole('button', { name: 'Seguir' }).click();
  await page.getByRole('checkbox', { name: /Leí y acepto/ }).check();
  await page.getByRole('button', { name: 'Aceptar y crear perfil' }).click();
  await expect(page).toHaveURL(/\/panel\/perfiles\/[0-9a-f-]{36}$/);
  const editorUrl = page.url();

  await page.getByRole('button', { name: 'Agregar alergia' }).click();
  await page.getByLabel('Alergia 1').fill('Penicilina');
  await page.getByRole('button', { name: 'Agregar contacto' }).click();
  await page.getByLabel('Nombre del contacto 1').fill('Jorge');
  await page.getByLabel('Teléfono del contacto 1').fill('3884123456');
  await page.getByRole('button', { name: 'Guardar ficha' }).click();
  await expect(page.getByText('Guardado. Tu QR ya muestra estos datos.')).toBeVisible();

  await page.getByRole('link', { name: 'Imprimir mi QR' }).click();
  await expect(page).toHaveURL(/\/imprimir$/);
  const front = page.getByLabel('Tarjeta de billetera (frente)');
  await expect(front).toContainText('Penicilina');
  await expect(front).toContainText('3884123456');
  await expect(front.locator('svg').first()).toBeVisible();
  await expect(page.getByLabel('Tarjeta de billetera (dorso)')).toContainText('/e/');
  await page.getByRole('button', { name: 'Imprimir' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __printed: number }).__printed)).toBe(1);

  // Al día: no pide reimprimir
  await page.goto('/panel');
  await expect(page.getByText('reimprimilo')).toHaveCount(0);

  // Cambia algo impreso → pide reimprimir
  await page.goto(editorUrl);
  await page.getByRole('button', { name: 'Agregar alergia' }).click();
  await page.getByLabel('Alergia 2').fill('Látex');
  await page.getByRole('button', { name: 'Guardar ficha' }).click();
  await expect(page.getByText('Guardado. Tu QR ya muestra estos datos.')).toBeVisible();
  await page.goto('/panel');
  await expect(page.getByText('Cambiaron datos de tu QR impreso: reimprimilo.')).toBeVisible();
});
