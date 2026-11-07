import { expect, test, type Page } from '@playwright/test';

async function signupWithCard(page: Page) {
  await page.goto('/registro');
  await page.getByLabel('Email').fill(`cuenta+${Date.now()}@mail.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Nombre').fill('Lucía');
  await page.getByLabel('Apellido').fill('Mamani');
  await page.getByRole('button', { name: 'Seguir' }).click();
  await page.getByRole('checkbox', { name: /Leí y acepto/ }).check();
  await page.getByRole('button', { name: 'Aceptar y crear perfil' }).click();
  await expect(page).toHaveURL(/\/panel\/perfiles\/[0-9a-f-]{36}$/);
  return (await page.getByRole('link', { name: 'Ver como el paramédico' }).getAttribute('href'))!;
}

test('generar un QR nuevo deja sin efecto el viejo', async ({ page }) => {
  const oldHref = await signupWithCard(page);
  await page.getByRole('link', { name: 'Imprimir mi QR' }).click();
  // Recién navegada, la página puede no tener React conectado: reintentamos el clic hasta que abra el diálogo.
  const dialog = page.getByRole('alertdialog');
  await expect(async () => {
    await page.getByRole('button', { name: 'Generar QR nuevo' }).click();
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass();
  await dialog.getByRole('button', { name: 'Sí, generar uno nuevo' }).click();
  await expect(page.getByText('Listo, tu QR es nuevo.')).toBeVisible();

  const res = await page.request.get(oldHref);
  expect(res.status()).toBe(404);
  // La hoja se vuelve a armar con el QR nuevo (refresco de la página en segundo plano).
  await expect
    .poll(async () => new URL((await page.getByRole('link', { name: /Probar el QR/ }).getAttribute('href'))!).pathname)
    .not.toBe(oldHref);
});

test('descargar mis datos y borrar la cuenta', async ({ page }) => {
  const cardHref = await signupWithCard(page);
  await page.goto('/panel/cuenta');

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: /Descargar mis datos/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^helpjuy-mis-datos-\d{4}-\d{2}-\d{2}\.json$/);

  await page.getByRole('button', { name: 'Borrar mi cuenta' }).click();
  const dialog = page.getByRole('alertdialog');
  await dialog.getByLabel(/Escribí BORRAR/).fill('BORRAR');
  await dialog.getByRole('button', { name: 'Borrar todo' }).click();
  await expect(page.getByText('Listo: borramos tu cuenta y todos sus datos.')).toBeVisible();

  expect((await page.request.get(cardHref)).status()).toBe(404);
  await page.goto('/panel');
  await expect(page).toHaveURL(/\/ingresar/);
});
