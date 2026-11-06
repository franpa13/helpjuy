import { expect, test, type Page } from '@playwright/test';
import { verifyEmail } from './helpers/db';

async function register(page: Page, email: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
}

test('grupo familiar: invitar por link, unirse y recibir el aviso de emergencia', async ({ page, browser }) => {
  const stamp = Date.now();

  // A: cuenta, ficha con contacto (QR activo)
  await page.goto('/registro');
  await register(page, `fam-a+${stamp}@mail.com`);
  await expect(page).toHaveURL(/\/panel\/perfiles\/nuevo/);
  await verifyEmail(`fam-a+${stamp}@mail.com`);
  await page.getByLabel('Nombre').fill('Francisco');
  await page.getByLabel('Apellido').fill('Paredes');
  await page.getByRole('button', { name: 'Seguir' }).click();
  await page.getByRole('checkbox', { name: /Leí y acepto/ }).check();
  await page.getByRole('button', { name: 'Aceptar y crear perfil' }).click();
  await expect(page).toHaveURL(/\/panel\/perfiles\/[0-9a-f-]{36}$/);
  await page.getByRole('button', { name: 'Agregar contacto' }).click();
  await page.getByLabel('Nombre del contacto 1').fill('Ana');
  await page.getByLabel('Teléfono del contacto 1').fill('3884123456');
  await page.getByRole('button', { name: 'Guardar ficha' }).click();
  await expect(page.getByText('Guardado. Tu QR ya muestra estos datos.')).toBeVisible();
  const cardHref = await page.getByRole('link', { name: 'Ver como el paramédico' }).getAttribute('href');

  // A: crear grupo e invitar
  await page.goto('/panel/familia');
  await expect(page.getByText('Todavía no tenés un grupo familiar')).toBeVisible();
  await page.getByLabel('Nombre del grupo').fill('Familia Paredes');
  await page.getByRole('button', { name: 'Crear grupo' }).click();
  await expect(page.getByRole('heading', { name: 'Familia Paredes' })).toBeVisible();
  // Al crear el grupo, el link de invitación aparece solo
  const inviteUrl = await page.getByLabel('Link de invitación').inputValue();
  expect(inviteUrl).toMatch(/\/unirme\/[A-Za-z0-9_-]{43}$/);
  await expect(page.getByRole('link', { name: 'Compartir por WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/);

  // B: abre el link sin cuenta, se registra y vuelve sola a la invitación
  const b = await (await browser.newContext({ baseURL: 'http://localhost:3100' })).newPage();
  await b.goto(new URL(inviteUrl).pathname);
  await expect(b.getByRole('heading', { name: 'Te invitan a Familia Paredes' })).toBeVisible();
  await expect(b.getByText('No vas a ver datos médicos')).toBeVisible();
  await b.getByRole('link', { name: 'Crear mi cuenta y unirme' }).click();
  await register(b, `fam-b+${stamp}@mail.com`);
  await expect(b).toHaveURL(/\/unirme\//);
  await verifyEmail(`fam-b+${stamp}@mail.com`);
  await b.getByRole('button', { name: 'Unirme a Familia Paredes' }).click();
  await expect(b).toHaveURL(/\/panel\/familia$/);
  await expect(b.getByRole('list', { name: 'Miembros de Familia Paredes' }).getByRole('listitem')).toHaveCount(2);

  // Alguien escanea el QR de A y marca emergencia
  // (comparte su ubicación: San Salvador de Jujuy)
  const visitor = await (
    await browser.newContext({
      baseURL: 'http://localhost:3100',
      geolocation: { latitude: -24.18571, longitude: -65.29944 },
      permissions: ['geolocation'],
    })
  ).newPage();
  await visitor.goto(cardHref!);
  await visitor.getByRole('button', { name: 'Es una emergencia: avisar a la familia' }).click();
  await expect(visitor.getByRole('checkbox', { name: /Compartir mi ubicación/ })).toBeChecked();
  await visitor.getByRole('button', { name: 'Sí, avisar a la familia de Francisco' }).click();
  await expect(visitor.getByText('Avisamos a 1 persona de la familia de Francisco.')).toBeVisible();
  await expect(visitor.getByRole('link', { name: 'Avisar por WhatsApp a Ana' })).toHaveAttribute('href', /wa\.me\/5493884123456/);

  // B ve el aviso en su panel, con la zona aproximada en el mapa
  await b.goto('/panel/avisos');
  const aviso = b.getByRole('list', { name: 'Avisos' }).getByRole('listitem');
  await expect(aviso).toHaveCount(1);
  await expect(aviso).toContainText('Francisco Paredes');
  await expect(aviso).toContainText('De tu familia');
  await expect(aviso.getByRole('link', { name: 'Abrir en Google Maps' })).toHaveAttribute(
    'href',
    'https://www.google.com/maps?q=-24.186,-65.299',
  );
  await expect(b.getByRole('region', { name: 'Mapa con la zona aproximada de cada aviso' })).toBeVisible();
  await expect(b.locator('.leaflet-interactive')).toHaveCount(1);
});
