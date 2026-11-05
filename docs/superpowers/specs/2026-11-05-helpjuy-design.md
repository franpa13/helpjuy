# HelpJuy — Ficha médica de emergencia con QR

**Fecha:** 2026-11-05 · **Contexto:** proyecto para una prehackatón en Jujuy, Argentina · **Estado:** diseño aprobado en conversación, pendiente de revisión final.

> Convención: lo marcado **(decisión del diseñador)** lo eligió quien escribió el diseño, no el autor de la idea. Todo lo demás lo pidió o lo aprobó el autor.

---

## 1. Intención y por qué

Cuando alguien sufre un accidente (moto, auto, peatón, en la calle o donde sea) y no puede hablar, el paramédico pierde minutos clave sin saber si es alérgico a algo, si toma anticoagulantes o si es diabético. HelpJuy es una web gratuita donde cualquier persona carga sus datos médicos de emergencia y obtiene un **QR imprimible** para la billetera, el casco, la moto o donde quiera. Quien lo escanea (paramédico o testigo) ve en segundos la información que necesita para actuar mejor y, con suerte, salvar una vida.

La meta del autor es que **la gente lo use**. El fracaso no sería técnico: sería que nadie se registre. Por eso cada decisión prioriza que registrarse sea rápido, simple y confiable.

## 2. Objetivos, no-objetivos y anti-objetivos

**Objetivos**
- Registro y QR utilizable en **menos de 3 minutos**.
- Página pública del QR que carga **al instante**, se lee al sol y con guantes, sin login.
- Cumplir la **Ley 25.326** de Protección de Datos Personales y ser transparente con el usuario.
- Costo de infraestructura: **$0**.
- Demo para el jurado: escanear un sticker impreso con un celular y que abra la ficha.

**No-objetivos (por ahora)**
- No es una historia clínica ni reemplaza al médico. Los datos los carga el usuario y no se verifican.
- No hay app nativa: es una web mobile-first.
- No hay integración con hospitales, SAME u obras sociales.
- No hay multi-idioma (solo español). No hay pagos.
- No se venden stickers físicos: el usuario los imprime.

**Anti-objetivos (fallaría aunque funcione)**
- Que el registro sea largo o intimidante y la gente abandone.
- Que la página del QR tarde en cargar o dependa de un servidor dormido.
- Que se filtren datos que el usuario no eligió publicar, o que se puedan adivinar QRs de otras personas.
- Que se vea como una plantilla genérica "hecha con IA" y no inspire confianza.

## 3. Usuarios

- **Titular**: la gente en general, no solo conductores. El formato principal es la **tarjeta de billetera**; el casco y la moto son formatos más.
- **Cuidador**: alguien que crea perfiles para sus hijos o padres mayores (una cuenta, varios perfiles).
- **Quien escanea**: un paramédico (necesita datos clínicos) o un testigo (necesita llamar al 107 y a la familia).

## 4. Datos médicos y prioridad de visualización

Todos los campos son **opcionales** (la ley impide obligar a dar datos sensibles). Para que el QR quede activo alcanza con **nombre y un contacto de emergencia**. El resto se completa después, con un indicador de progreso ("tu ficha está al 60%").

**Prioridad en la página pública** (orden aprobado; mockup en `docs/design/ficha-emergencia-v3.html`):

1. **Identidad**: nombre y apellido, sexo, fecha de nacimiento (se muestra la edad calculada), idioma.
2. **Signos fijos**: edad, **grupo sanguíneo y factor**, peso (kg), altura (cm), en cuatro bloques grandes.
3. **Alergias**: cada una con sustancia y reacción (por ejemplo "Penicilina — anafilaxia"). Bloque rojo, la letra más grande de la página.
4. **Condiciones**: diabetes, epilepsia, cardiopatía, marcapasos, asma, hemofilia, embarazo, etc., con una nota corta.
5. **Medicación actual**: nombre y dosis. Los **anticoagulantes** llevan una etiqueta destacada. Para marcarlos, el usuario tilda "es anticoagulante" o elige de una lista corta de comunes (decisión del diseñador).
6. **Para tener en cuenta**: cómo comunicarse (sordera, autismo, demencia, no habla español), si acepta transfusiones, donante de órganos, voluntades anticipadas.
7. **Más información (plegado)**: cirugías previas, implantes o prótesis metálicas, obra social o prepaga y número de afiliado, médico de cabecera, notas libres.
8. **Botones de llamada**: **107 (SAME Jujuy)** y contacto de emergencia principal. En celular quedan fijos abajo; en tablet y escritorio, en una columna lateral. Puede haber un segundo contacto.
9. **Pie**: "Datos cargados por el titular, no verificados por un médico", fecha de última actualización y aviso de que el escaneo queda registrado.

**Nunca se muestra en público**: domicilio, DNI, email ni datos de la cuenta.

**Visibilidad por campo** (decisión del diseñador): cada campo o sección tiene un interruptor "mostrar en mi QR". Por defecto quedan visibles los campos clínicos y privados los administrativos (obra social, número de afiliado, médico). Hay una **vista previa** de "lo que ve el paramédico".

## 5. Estilo visual (aprobado)

Referencia: `docs/design/ficha-emergencia-v3.html`.
- Estética de **ficha médica o pulsera de hospital**: fondo color papel (`#f7f5f0`), tinta casi negra, reglas negras gruesas entre bloques, esquinas rectas, colores planos. **Sin degradados, sombras, emojis ni bordes muy redondeados.**
- Tipografías: **Atkinson Hyperlegible** para el texto (alta legibilidad, Braille Institute) y **Barlow Condensed** para títulos, etiquetas y números.
- Colores semánticos: rojo `#c8102e` para lo crítico (alergias, sangre, 107), ámbar `#b45309` para condiciones, azul `#1f4e8c` para medicación.
- Responsive con breakpoint en ~700 px. El resto de la web (landing, registro, panel) sigue el mismo lenguaje visual.
- Lenguaje simple en toda la UI ("¿Tomás algún remedio todos los días?" en lugar de "medicación crónica").

## 6. Funcionalidades

### 6.1 Registro y sesión (decisión del diseñador)
- Se entra con **Google (OAuth)** o con **email y contraseña**. El email se verifica con un link. Hay recuperación de contraseña.
- Contraseñas con **argon2**. La sesión va en una cookie httpOnly, Secure y SameSite=Lax.
- Los emails (verificación, recuperación, aviso de escaneo) se envían con **Resend**.

### 6.2 Consentimiento
- Antes de cargar datos médicos se muestra una pantalla de **consentimiento expreso e informado**: qué se guarda, qué se publica en el QR, dónde se aloja (UE), cómo borrarlo. La casilla **no viene premarcada**.
- Se guarda la versión del texto aceptado, la fecha y hora y el perfil al que aplica. Si cambia el texto, se vuelve a pedir.
- En **menores**, el adulto declara ser padre, madre o tutor.
- Hay una política de privacidad en lenguaje simple (una pantalla) y la versión legal completa.

### 6.3 Perfiles
- Una cuenta puede tener **varios perfiles** (yo, mi hijo, mi papá), cada uno con su ficha, su QR y su consentimiento.

### 6.4 Ficha de emergencia pública
- URL: `/e/{token}`. El token es **aleatorio criptográficamente** (≥128 bits, base62/base64url). Nunca se usa el DNI ni un número correlativo.
- **Sin login**, `noindex, nofollow`, `X-Robots-Tag`, sin analytics de terceros.
- **Rate limiting** contra enumeración. Un token inválido muestra un mensaje genérico.
- **Disponibilidad**: la página **no depende de que el backend esté despierto**. Next.js la sirve pre-generada o cacheada desde el edge de Vercel (ISR o equivalente), y el backend dispara la **revalidación on-demand** cuando el titular edita sus datos, cambia la visibilidad o regenera el token. Al regenerar el token, el viejo deja de responder de inmediato.
- **Primer escaneo de un QR nuevo** (decisión del diseñador): para que nunca toque un backend dormido, cuando se crea o se actualiza una ficha la API dispara la revalidación **y además pide la página una vez para dejarla cacheada (warm-up)**. Si la revalidación falla, se sigue sirviendo la versión anterior (stale-while-revalidate).
- **Lo impreso respeta la visibilidad** (decisión del diseñador): en el sticker y la tarjeta solo se imprimen campos marcados como públicos.
- **Registro del escaneo**: lo hace el cliente con un envío fire-and-forget (por ejemplo `navigator.sendBeacon`) a la API. Si la API está dormida, la ficha se muestra igual.

### 6.5 Impresión
- Se genera un **PDF o una página imprimible** con tres formatos:
  - **Tarjeta de billetera** (85,6 × 54 mm): QR de un lado y datos clave del otro. Es el formato principal.
  - **Sticker para casco o moto**, diseño "B" aprobado: QR más **alergias graves, grupo sanguíneo y un teléfono** impresos, para que sirva sin señal.
  - **Versión grande** (A5/A6) para el parabrisas o la heladera.
- Se recomienda cubrir el sticker con cinta transparente o plastificarlo.
- El QR apunta a la URL con token. Si el titular cambia **datos que van impresos**, la web avisa que conviene reimprimir.

### 6.6 Transparencia y control
- **Historial de escaneos** por perfil (fecha, hora y, si se puede, ciudad aproximada; nunca la IP completa visible).
- **Aviso por email** al titular cuando escanean su QR (decisión del diseñador). Se puede desactivar y tiene un throttle de **máximo 1 email por hora por perfil**. La ciudad aproximada se toma de los headers geo de Vercel (decisión del diseñador).
- **Regenerar QR** si se pierde el casco o la billetera.
- **Descargar todos mis datos** (JSON) y **borrar la cuenta** con un clic. El borrado es real: se eliminan registros, tokens y logs.

### 6.7 Adopción
- **Landing** que explica en 10 segundos para qué sirve y por qué es seguro.
- Botón **"Compartir por WhatsApp"** ("Me hice mi ficha de emergencia, hacé la tuya").
- Mobile-first, liviana para Androids de gama baja.

### 6.8 Grupos familiares y avisos de emergencia (agregado el 2026-11-05)
Detalle completo en `docs/specs/family/spec.md`. Se construye en el Plan 3.
- Un usuario crea **grupos familiares** e invita a otras **cuentas**, que tienen que aceptar. Una persona puede estar en varios grupos.
- Estar en un grupo **no da acceso a los datos médicos** de los demás; solo sirve para recibir avisos.
- **Escaneo normal**: le avisa solo al dueño de la ficha. **Emergencia**: quien escanea toca "Es una emergencia: avisar a la familia" y se avisa a todos los miembros de los grupos del dueño. Hay un límite de un aviso cada 10 minutos por perfil.
- Canales gratuitos: email (Resend), notificación push web y un botón "Avisar por WhatsApp" que abre el WhatsApp de quien escanea. SMS y la API oficial de WhatsApp quedan fuera porque son pagos.
- La ubicación solo se manda si quien escanea la permite; se guarda aproximada y se borra a los 30 días.

## 7. Marco legal (Argentina, Jujuy)

No es asesoramiento legal; es la base que el producto respeta.
- **Ley 25.326**: los datos de salud son **datos sensibles**. Requieren consentimiento expreso, informado y por escrito (§6.2). Nadie puede ser obligado a darlos (todo opcional). El titular tiene derecho de acceso, rectificación y supresión (§6.6).
- **Transferencia internacional (art. 12)**: la base y el backend se alojan en **Frankfurt (UE)**, jurisdicción considerada adecuada por Argentina. El texto de consentimiento lo informa.
- **AAIP**: si el proyecto continúa después de la hackatón, inscribir la base en el Registro Nacional de Bases de Datos (gratis). Para la hackatón alcanza con dejarlo documentado.
- **Menores**: consentimiento del padre, madre o tutor.
- **Seguridad**: HTTPS en todo, cifrado en reposo (lo da Neon) y además **cifrado a nivel de aplicación de los campos médicos** (AES-256-GCM con la clave en una variable de entorno; decisión del diseñador), mínimo de datos y secretos fuera del repo.
- **Disclaimer visible** en la ficha y en los términos.

## 8. Arquitectura

### 8.1 Stack (pedido por el autor)
- **Frontend:** Next.js (App Router, TypeScript).
- **Backend:** NestJS (TypeScript).
- **Base de datos:** PostgreSQL en **Neon**.
- **ORM:** Prisma (decisión del diseñador).

### 8.2 Organización: monorepo por features (pedido por el autor; detalle del diseñador)
```
helpjuy/
  apps/
    web/            # Next.js
      src/features/<feature>/   (components, hooks, server actions, api client, types)
      src/app/                 (solo rutas que componen features)
    api/            # NestJS
      src/features/<feature>/  (module, controller, service, dto, repository, tests)
      src/shared/              (config, crypto, prisma, guards)
  packages/
    contracts/      # tipos y esquemas (zod) compartidos web↔api
  docs/
    specs/<feature>/spec.md
```
Features: `auth`, `consent`, `profiles`, `medical-record`, `emergency-card` (página pública más revalidación), `qr-print`, `scan-log`, `account` (exportar y borrar), `landing`.

Gestor del monorepo: pnpm workspaces (decisión del diseñador; Turborepo opcional).

### 8.3 Despliegue gratuito (aprobado)
| Pieza | Servicio | Notas |
|---|---|---|
| DB | Neon free, región **AWS eu-central-1 (Frankfurt)** | 0,5 GB/proyecto, ~191 h de cómputo/mes (0,25 CU 24/7) |
| Web | Vercel Hobby | Edge con presencia en Sudamérica |
| API | Render free, región Frankfurt | Se duerme tras 15 min; 750 h/mes |
| Keep-alive | cron-job.org (o GitHub Actions) | Ping a `/health` cada 10 min |
| Email | Resend free | 3.000/mes |

La resiliencia de la ficha pública **no puede depender** del keep-alive: el cacheo y la revalidación on-demand (§6.4) son el mecanismo principal, y el keep-alive es solo para que el panel del titular responda rápido.

## 9. Proceso: spec-driven development (pedido por el autor)

- Cada feature tiene `docs/specs/<feature>/spec.md` con objetivo, alcance, reglas, modelo de datos que toca, endpoints o pantallas y **criterios de aceptación en formato Dado/Cuando/Entonces**.
- Se escribe y revisa la spec **antes** del código. Los tests (unitarios en api y e2e de los flujos clave) se derivan de los criterios de aceptación.
- Los contratos compartidos (`packages/contracts`) se definen desde la spec.
- Orden sugerido: `auth` → `consent` → `profiles` → `medical-record` → `emergency-card` → `qr-print` → `scan-log` → `account` → `landing`.

## 10. Demo de la prehackatón

1. Registrarse con Google, aceptar el consentimiento y cargar nombre, contacto y una alergia (menos de 3 minutos).
2. Descargar e imprimir la tarjeta o el sticker.
3. Escanearlo con un celular: la ficha abre al instante.
4. Mostrar el historial de escaneos y el email de aviso.

## 11. Queda a criterio del implementador

- Esquema exacto de tablas (la sección 4 define el contenido).
- Librería de QR y de PDF.
- Librería de componentes (respetando el estilo de §5) y manejo de formularios.
- Estrategia exacta de cache en Next (ISR, `revalidateTag`, etc.), siempre que cumpla §6.4.
- Herramientas de test, lint y CI.
