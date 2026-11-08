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
  // Al imprimir se ve solo la hoja (antes salían páginas en blanco: la regla que oculta el resto le ganaba a la hoja).
  await page.emulateMedia({ media: 'print' });
  const visibility = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).visibility);
  expect(await visibility('#hoja-imprimible')).toBe('visible');
  expect(await visibility('#hoja-imprimible section')).toBe('visible');
  expect(await visibility('h1')).toBe('hidden');
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Imprimir' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __printed: number }).__printed)).toBe(1);
  await page.getByRole('button', { name: 'Sí, ya lo tengo impreso' }).click();
  await expect(page.getByText(/Listo. Si cambiás algo/)).toBeVisible();

  // Al día: no pide reimprimir
  await page.goto('/panel');
  await expect(page.getByText('reimprimilo')).toHaveCount(0);
  await expect(page.getByText('Tu QR está listo: imprimilo.')).toHaveCount(0);

  // Cambia algo impreso → pide reimprimir
  await page.goto(editorUrl);
  await page.getByRole('button', { name: 'Agregar alergia' }).click();
  await page.getByLabel('Alergia 2').fill('Látex');
  await page.getByRole('button', { name: 'Guardar ficha' }).click();
  await expect(page.getByText('Guardado. Tu QR ya muestra estos datos.')).toBeVisible();
  await page.goto('/panel');
  await expect(page.getByText('Cambiaron datos de tu QR impreso: reimprimilo.')).toBeVisible();
});

test('con datos al máximo de largo, nada se desborda de la tarjeta ni de los stickers', async ({ page }) => {
  const long = (n: number, base: string) => (base + ' ').repeat(20).slice(0, n).trim();
  await page.goto('/registro');
  await page.getByLabel('Email').fill(`largo+${Date.now()}@mail.com`);
  await page.getByLabel('Contraseña', { exact: true }).fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Nombre').fill(long(60, 'Maximiliano'));
  await page.getByLabel('Apellido').fill(long(60, 'Fernández'));
  await page.getByRole('button', { name: 'Seguir' }).click();
  await page.getByRole('checkbox', { name: /Leí y acepto/ }).check();
  await page.getByRole('button', { name: 'Aceptar y crear perfil' }).click();
  await expect(page).toHaveURL(/\/panel\/perfiles\/[0-9a-f-]{36}$/);
  for (let i = 1; i <= 4; i++) {
    await page.getByRole('button', { name: 'Agregar alergia' }).click();
    await page.getByLabel(`Alergia ${i}`).fill(long(80, 'Antiinflamatorios'));
  }
  await page.getByRole('button', { name: 'Agregar remedio' }).click();
  await page.getByLabel('Remedio 1').fill('Warfarina');
  await page.getByText('Es anticoagulante').click();
  await page.getByRole('button', { name: 'Agregar contacto' }).click();
  await page.getByLabel('Nombre del contacto 1').fill(long(60, 'Bartolomé'));
  await page.getByLabel('Teléfono del contacto 1').fill('+54 9 388 412-3456');
  await page.getByRole('button', { name: 'Guardar ficha' }).click();
  await expect(page.getByText('Guardado. Tu QR ya muestra estos datos.')).toBeVisible();
  await page.goto(page.url() + '/imprimir');

  for (const label of ['Tarjeta de billetera (frente)', 'Tarjeta de billetera (dorso)', 'Sticker para casco o moto']) {
    const box = page.getByLabel(label).first();
    const overflow = await box.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(overflow, `${label} se desborda ${overflow}px`).toBeLessThanOrEqual(1);
  }
  const front = page.getByLabel('Tarjeta de billetera (frente)');
  await expect(front).toContainText('ANTICOAGULADO');
  await expect(front).toContainText('+1');
  await expect(front).toContainText('388 412-3456');
});
