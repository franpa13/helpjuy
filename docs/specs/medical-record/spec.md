# Feature: medical-record

## Objetivo
Que el titular cargue y edite la ficha médica de cada perfil, con todos los datos opcionales, y elija qué sección se ve en su QR.

## Reglas
- La ficha se guarda **cifrada** (AES-256-GCM, `MEDICAL_DATA_KEY`) como un único JSON. La visibilidad por sección se guarda en claro.
- Contrato: `medicalRecordSchema` y `saveMedicalRecordSchema` de `@helpjuy/contracts`.
- Visibilidad por defecto: lo clínico es público y `insurance`, `doctor` y `notes` son privados.
- "No tengo" (`allergiesNone`, `conditionsNone`, `medicationsNone`) es una respuesta válida y distinta de "no cargado".
- Completitud: 8 preguntas clave con el mismo peso (ver `completion`). El QR queda **activo** con al menos un contacto.
- Perfil ajeno o inexistente → 404 `not_found`.
- Después de guardar se invalida la ficha pública cacheada (feature `emergency-card`). Un fallo de esa invalidación no rompe el guardado.

## API (con sesión)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/profiles/:id/record` | — | 200 `{ data, visibility, updatedAt }` (vacía si no hay) |
| PUT | `/profiles/:id/record` | `{ data, visibility }` | 200 `{ data, visibility, updatedAt }` |

`GET /profiles` y `GET /profiles/:id` incluyen `completion` (0–100) y `active`.

## Criterios de aceptación
- **Dado** un perfil sin ficha, **cuando** se pide, **entonces** vuelve vacía, con la visibilidad por defecto y `updatedAt: null`.
- **Dada** una ficha guardada, **cuando** se lee, **entonces** vuelven los mismos datos.
- **Dada** una ficha guardada, **entonces** en la base no aparece ningún dato médico en claro.
- **Dado** un perfil ajeno, **cuando** se lee o se guarda su ficha, **entonces** 404.
- **Dado** un payload inválido (por ejemplo, un teléfono con letras), **entonces** 400 `validation`.
- **Dada** una ficha con un contacto y alergias, **entonces** `GET /profiles` informa `active: true` y la completitud correspondiente.
