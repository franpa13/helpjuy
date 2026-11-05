# Feature: consent

## Objetivo
Obtener y registrar el **consentimiento expreso, informado y por escrito** que exige la Ley 25.326 para tratar datos de salud (datos sensibles), antes de guardar cualquier dato médico de un perfil.

## Reglas
- El consentimiento se da **por perfil**, al crearlo. La casilla **nunca viene premarcada**.
- Versión vigente: `CONSENT_VERSION = "2026-11-05"`. Si cambia el texto, cambia la versión y se vuelve a pedir.
- Se guarda un `ConsentRecord` con usuario, perfil, versión, fecha y hora, y si se declaró tutor.
- En perfiles de **menores** el adulto debe declarar que es padre, madre o tutor.

## Contenido obligatorio del texto (lenguaje simple)
1. Qué datos se guardan (identificación, contacto de emergencia y datos de salud que el usuario elija cargar).
2. Que **todos los datos son opcionales**.
3. Que lo marcado como público lo ve **cualquier persona que escanee el QR**, sin iniciar sesión.
4. Que los datos se alojan en **Frankfurt (Unión Europea)**, jurisdicción considerada adecuada por la normativa argentina.
5. Que los datos **no se verifican médicamente**.
6. Que se pueden **ver, corregir, descargar y borrar** en cualquier momento.
7. Marco legal: Ley 25.326, datos sensibles.

## API
| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/consent/current` (público) | 200 `{ version, text }` |

## Criterios de aceptación
- **Dado** `accepted` distinto de `true`, **entonces** 400 `validation` y no se crea nada.
- **Dada** una versión distinta de `CONSENT_VERSION`, **entonces** 409 `{ error: 'consent_outdated', currentVersion }`.
- **Dado** `isMinor: true` sin `guardianDeclared: true`, **entonces** 400 `{ error: 'guardian_required' }`.
- **Dado** un perfil creado, **entonces** existe un `ConsentRecord` con versión, usuario y perfil.
- **Dado** cualquier visitante, **cuando** pide `/consent/current`, **entonces** recibe la versión y el texto sin iniciar sesión.
