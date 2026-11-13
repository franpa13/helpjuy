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
  await expect(page).toHaveURL(/\/panel\/perfiles\/[0-9a-f-]{36}$/);
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
  await expect(card.getByRole('link', { name: /Llamar a Jorge/ }).first()).toHaveAttribute('href', 'tel:3884123456');

  // Ocultar la medicación y confirmar que desaparece de la ficha pública
  await page.getByRole('radiogroup', { name: /Medicación: ¿quién lo ve?/ }).getByRole('radio', { name: /Solo yo/ }).click();
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

/** Una foto chica (JPEG) como la que elegiría alguien de la galería. */
const PHOTO = Buffer.from(
  '/9j/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAwAEADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAUG/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AjAR2mAAAAAAAAAAAAAAAAAAAAAAf/9k=',
  'base64',
);

test('la portada invita a probar la ficha de ejemplo, que no llama ni avisa a nadie', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Ver la ficha de ejemplo' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole('heading', { level: 1, name: /Lucía Mamani/ })).toBeVisible();
  await expect(page.getByRole('note', { name: 'Ficha de ejemplo' })).toBeVisible();
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  await page.getByRole('button', { name: /Es una emergencia/ }).click();
  await page.getByRole('button', { name: /Sí, avisar a la familia de Lucía/ }).click();
  await expect(page.getByText(/En una ficha real/)).toBeVisible();
});

test('subir una foto: queda oculta hasta que elegís mostrarla en el QR', async ({ page, context }) => {
  await page.goto('/registro');
  await page.getByLabel('Email').fill(`foto+${Date.now()}@mail.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Nombre').fill('Lucía');
  await page.getByLabel('Apellido').fill('Mamani');
  await page.getByRole('button', { name: 'Seguir' }).click();
  await page.getByRole('checkbox', { name: /Leí y acepto/ }).check();
  await page.getByRole('button', { name: 'Aceptar y crear perfil' }).click();
  await expect(page).toHaveURL(/\/panel\/perfiles\/[0-9a-f-]{36}$/);

  // La foto está entre lo opcional (plegado). Subirla: se guarda al toque
  await page.getByRole('button', { name: /Completá cuando puedas/ }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: 'yo.jpg', mimeType: 'image/jpeg', buffer: PHOTO });
  await expect(page.getByRole('button', { name: /Cambiar foto/ })).toBeVisible();

  const href = await page.getByRole('link', { name: 'Ver como el paramédico' }).getAttribute('href');
  const visitor = await context.browser()!.newContext({ baseURL: 'http://localhost:3100' });
  const card = await visitor.newPage();
  await card.goto(href!);
  await expect(card.getByRole('heading', { name: 'Lucía Mamani' })).toBeVisible();
  await expect(card.getByRole('img', { name: 'Foto de Lucía Mamani' })).toHaveCount(0);

  // Mostrarla en el QR
  await page.getByRole('radiogroup', { name: /Foto: ¿quién lo ve?/ }).getByRole('radio', { name: /Se ve en el QR/ }).click();
  await page.getByRole('button', { name: 'Guardar ficha' }).click();
  await expect(page.getByText('Guardado. Tu QR ya muestra estos datos.')).toBeVisible();
  await expect
    .poll(async () => {
      await card.reload();
      return card.getByRole('img', { name: 'Foto de Lucía Mamani' }).count();
    })
    .toBe(1);
  await visitor.close();
});
