# Deploy gratis: Neon + Render + Vercel

Orden: base → API → web → volver a la API → Google → emails → crons → probar.

## 1. Base de datos: Neon

1. Crear cuenta en <https://neon.tech> y un proyecto **helpjuy**, región **AWS Europe Central 1 (Frankfurt)**, Postgres 17.
2. En **Connection string** copiar dos:
   - **Con pooling** activado (el host tiene `-pooler`): va en `DATABASE_URL`.
   - **Sin pooling**: va en `DIRECT_URL`.
   Las dos terminan en `?sslmode=require`.

## 2. Clave de cifrado

En tu compu:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Ese valor es `MEDICAL_DATA_KEY`. **Guardalo en un gestor de contraseñas**: si se pierde, los datos médicos guardados
no se pueden leer nunca más. No lo pegues en chats ni en el repo.

## 3. API: Render

1. Crear cuenta en <https://render.com> con GitHub.
2. **New → Blueprint** → elegir el repo. Render lee `render.yaml` y arma el servicio `helpjuy-api` (Frankfurt, plan Free).
3. Completar lo que pide:
   - `DATABASE_URL` y `DIRECT_URL`: las de Neon.
   - `WEB_URL`: por ahora `https://helpjuy.vercel.app` (se corrige en el paso 5).
   - `MEDICAL_DATA_KEY`: la del paso 2.
   - `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: se pueden dejar vacías por ahora.
4. **Apply**. El primer deploy tarda unos minutos (aplica las migraciones al arrancar).
5. Probar `https://helpjuy-api.onrender.com/health` → `{"status":"ok"}`. Anotar la URL real del servicio.
6. En **Environment** copiar `PROXY_SECRET` y `REVALIDATE_SECRET` (los generó Render): van iguales en Vercel.

## 4. Web: Vercel

1. Crear cuenta en <https://vercel.com> con GitHub → **Add New → Project** → elegir el repo.
2. **Root Directory**: `apps/web` (framework Next.js se detecta solo; el build sale de `apps/web/vercel.json`).
3. **Environment Variables**:
   - `API_URL` = URL de Render (ej. `https://helpjuy-api.onrender.com`).
   - `PROXY_SECRET` y `REVALIDATE_SECRET` = los mismos de Render.
   - `SITE_URL` = la URL de Vercel (ej. `https://helpjuy.vercel.app`). Es la que va dentro del QR.
   - `GOOGLE_AUTH_ENABLED` = `false` (o `true` cuando termines el paso 6).
   - `CONTACT_EMAIL` = un email de contacto para la política de privacidad (opcional, se muestra en `/privacidad`).
4. **Deploy**. Si la URL final no es la que pusiste en `SITE_URL`, corregila y volvé a desplegar.

## 5. Volver a Render

En **Environment** poner `WEB_URL` = la URL real de Vercel (sin barra al final) → **Save** (redespliega solo).

## 6. Ingreso con Google (opcional)

1. Google Cloud Console → APIs & Services → Credentials → tu OAuth Client (conviene **rotar el secreto**: el anterior se compartió en un chat).
2. **Authorized JavaScript origins**: `https://<tu-web>.vercel.app`.
3. **Authorized redirect URIs**: `https://<tu-web>.vercel.app/api/auth/google/callback`.
4. **Google Auth Platform → Público**: en *Prueba* solo entran los *usuarios de prueba* que agregues. Para publicar,
   primero completá **Información de la marca**: nombre *HelpJuy*, email de asistencia, página principal
   `https://<tu-web>.vercel.app`, política de privacidad `https://<tu-web>.vercel.app/privacidad`, dominio autorizado
   `<tu-web>.vercel.app`. **No subas logo** (con logo Google pide verificar la marca). Después: **Público → Publicar app**.
5. Render: `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`. Vercel: `GOOGLE_AUTH_ENABLED=true` y redesplegar.

## 7. Emails (opcional para probar)

- **Sin Resend**: los emails (confirmación, avisos) aparecen en **Render → Logs**. Para confirmar tu email copiás el link de ahí.
- **Con Resend** (<https://resend.com>, gratis): crear una API key → `RESEND_API_KEY` en Render. Con el remitente
  `onboarding@resend.dev` **solo llegan a tu propio email** (el de la cuenta de Resend). Para mandarle a cualquiera hay que
  verificar un dominio propio en Resend y cambiar `MAIL_FROM` (ej. `HelpJuy <avisos@tudominio.com>`).
  Ojo: si un aviso de emergencia no le llega a nadie, la API responde error; para probar avisos, usá tu propio email.

## 8. Crons gratis: cron-job.org

La API gratis de Render se duerme a los 15 minutos sin uso y tarda ~50 s en despertar (mala idea con un botón de emergencia).

1. **Despierta**: GET `https://<tu-api>.onrender.com/health` cada **10 minutos**.
   (Render da 750 h por mes: alcanza para tener un servicio despierto todo el mes.)
2. **Limpieza**: POST `https://<tu-api>.onrender.com/internal/maintenance` una vez por día (ej. 04:00), con el header
   `x-maintenance-secret: <MAINTENANCE_SECRET de Render>`.

## 9. Probar

1. Abrir la web → **Crear mi ficha** → confirmar el email (Resend o logs de Render).
2. Cargar alergias y un contacto → **Imprimir mi QR** → escanear el QR con otro celular.
3. En la ficha: **Es una emergencia** → aceptar la ubicación (con HTTPS ya la pide) → revisar **Avisos** en el panel.
4. Revisar que el email "Alguien abrió la ficha" llegue (o aparezca en los logs).

## Si algo falla

- **Render no arranca**: Logs. Lo más común es una variable mal copiada (`DATABASE_URL`, `MEDICAL_DATA_KEY` de 32 bytes, `WEB_URL`).
- **La web da error al cargar el panel**: `API_URL` mal, o `PROXY_SECRET` distinto entre Render y Vercel.
- **Imprimir dice que falta SITE_URL**: tiene que ser la URL https pública de Vercel.
- **La ficha pública no se actualiza al editar**: `REVALIDATE_SECRET` distinto entre Render y Vercel, o `WEB_URL` mal en Render.
