# Plan 3b — Imprimir el QR

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Que cada ficha tenga una hoja imprimible (A4) con tarjeta de billetera (frente y dorso), stickers para casco/moto y una versión grande, y que el panel avise cuándo hay que reimprimir.

**Spec:** diseño §6.5 (impresión) y §4 (visibilidad).

## Global Constraints
- Lo impreso sale de una única función compartida `printableData(profile, record, visibility)` en `@helpjuy/contracts`. La usan la web (para dibujar) y la API (para la huella). Incluye solo secciones visibles: nombre, hasta 3 alergias (o "Sin alergias conocidas"), grupo sanguíneo, si toma anticoagulantes y el primer contacto (nombre y teléfono).
- **Nunca** se imprimen la fecha de nacimiento ni datos de secciones privadas.
- Huella = sha256 de `{ token, printable }`. `POST /profiles/:id/printed` la calcula **en el servidor** y la guarda (`printedHash`, `printedAt`). `ProfileDto.printStatus`: `never | ok | outdated`. Rotar el token o cambiar algo impreso → `outdated`.
- QR: `qrcode` con corrección de errores **M**, apuntando a `{SITE_URL}/e/{token}`. `SITE_URL` toma por defecto `http://localhost:3000`.
- Medidas reales en CSS de impresión: tarjeta 85,6 × 54 mm, sticker 80 × 50 mm, grande A6 105 × 148 mm, `@page A4`, con líneas de corte punteadas.

## Review Focus
1. Una sección privada no aparece impresa (ni alergias, ni sangre, ni contacto).
2. Rotar el QR → el panel pide reimprimir.
3. Un cambio que no se imprime (por ejemplo, la obra social) **no** pide reimprimir.
4. Nombres largos y muchas alergias no rompen el diseño de la tarjeta: se recortan a 3 alergias con "+N".

### Task 1: contrato + API
`printableData` y sus tests en contracts. Prisma `Profile.printedHash?`, `printedAt?`. `printStatus` en `ProfileDto`. `POST /profiles/:id/printed`. Tests e2e: never → ok → outdated (al cambiar una alergia y al rotar), sin cambio al tocar la obra social, y perfil ajeno → 404.

### Task 2: web
`/panel/perfiles/[id]/imprimir`: vista previa en pantalla y botón "Imprimir" (marca como impreso y llama a `window.print()`), con consejos (papel autoadhesivo, cinta transparente o plastificado). Componentes `WalletCard`, `HelmetSticker`, `FridgeCard` y `PrintSheet`. En el panel, los links "Imprimir QR" y el aviso de reimprimir; en el editor, el link "Imprimir mi QR". Tests de componentes.

### Task 3: e2e y verificación
Imprimir → estado ok → cambiar una alergia → el panel muestra "reimprimilo". Suite completa, commit y push solo si todo pasa.
