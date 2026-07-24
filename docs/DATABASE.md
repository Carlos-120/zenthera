# DATABASE

Motor: PostgreSQL
Migraciones: Flyway en `zenthera-backend/src/main/resources/db/migration/`
Última actualización: 2026-07-12

---

## Estado de migraciones

| Versión | Archivo | Estado | Fecha |
|---|---|---|---|
| V1 | V1__baseline.sql | Aplicada | — |
| V2 | V2__create_pacientes.sql | Aplicada | — |
| V3 | V3__create_medicos.sql | Aplicada | — |
| V4 | V4__refresh_tokens.sql | Aplicada ✅ | 2026-07-12 |
| V5 | V5__onboarding_clinicas.sql | Aplicada ✅ | 2026-07-12 |

---

## Tabla `clinicas`

Creada en: V1__baseline.sql

Campos principales:
- id (PK)
- nombre
- ruc (único)
- telefono
- correo
- direccion, ciudad, provincia, pais
- activa (boolean)
- created_at, updated_at

---

## Tabla `roles`

Creada en: V1__baseline.sql

Valores seedados por RolInitializer:
- SUPER_ADMIN
- ADMIN_CLINICA
- MEDICO
- RECEPCIONISTA

---

## Tabla `usuarios`

Creada en: V1__baseline.sql

Campos principales:
- id (PK)
- clinica_id (FK → clinicas.id)
- rol_id (FK → roles.id)
- nombres, apellidos
- cedula (único)
- correo (único)
- password (bcrypt)
- foto
- activo, bloqueado, cambiarPassword (boolean)
- ultimoLogin
- created_at, updated_at

---

## Tabla `refresh_tokens` — V4

Creada en: V4__refresh_tokens.sql

Propósito: Almacenar refresh tokens con hash SHA-256 para rotación segura y detección de reutilización.

Campos:
- id (PK)
- usuario_id (FK → usuarios.id, NOT NULL)
- token_hash (VARCHAR 64, único, NOT NULL) — SHA-256 del token opaco
- familia (VARCHAR 36, NOT NULL) — UUID compartido por la cadena de renovación
- revocado (boolean, default false)
- expira_en (TIMESTAMP, NOT NULL)
- created_at (TIMESTAMP, NOT NULL)

Restricciones:
- FK usuario_id → usuarios(id) ON DELETE CASCADE
- UNIQUE (token_hash)

Índices:
- idx_refresh_token_hash sobre (token_hash)
- idx_refresh_token_usuario sobre (usuario_id)
- idx_refresh_token_familia sobre (familia)

Política de retención: Los tokens expirados pueden purgarse periódicamente. Los revocados deben mantenerse durante el período de expiración para detectar reutilización.

---

## Tabla `pacientes`

Creada en: V2__create_pacientes.sql

Campos principales:
- id (PK), clinica_id (FK), cedula, nombres, apellidos
- fecha_nacimiento, sexo, telefono, correo, direccion
- tipo_sangre, alergias, contacto_emergencia, telefono_emergencia
- activo, created_at, updated_at

Restricciones:
- FK clinica_id → clinicas(id)
- UNIQUE uk_paciente_clinica_cedula (clinica_id, cedula)

---

## Tabla `medicos`

Creada en: V3__create_medicos.sql

Campos principales:
- id (PK), clinica_id (FK), cedula, nombres, apellidos
- especialidad, telefono, correo, direccion, registro_profesional
- activo, created_at, updated_at

Restricciones:
- FK clinica_id → clinicas(id)
- UNIQUE uk_medico_clinica_cedula (clinica_id, cedula)

Nota pendiente: `registro_Profesional` debe estandarizarse a snake_case minúsculo en próxima migración controlada.

---

## Migración V5 — `V5__onboarding_clinicas.sql`

Creada en: V5__onboarding_clinicas.sql

Propósito: Soportar el onboarding transaccional de clínicas y la auditoría rigurosa de cambios de estado (suspensión lógica).

Cambios aplicados:
1. `clinicas.zona_horaria`: Modificada para ser `NOT NULL` con un backfill previo.
2. `auditoria_estado_clinicas`: Tabla para el historial inmutable de activaciones y suspensiones.
   - Campos: `id`, `clinica_id`, `usuario_id` (admin que realiza la acción), `estado_anterior`, `estado_nuevo`, `motivo`, `created_at`.
   - Restricciones: `CHECK(estado_anterior <> estado_nuevo)`, `CHECK(BTRIM(motivo) <> '')`.
3. `activation_tokens`: Tabla para tokens opacos de invitación a nuevos administradores.
   - Campos: `id`, `usuario_id`, `token_hash`, `fecha_expiracion`, `usado`, `created_at`, `updated_at`.

---

## Próximas migraciones previstas

| Versión | Propósito | Estado |
|---|---|---|
| V6 | Pendiente — slice Usuarios o Pacientes | En planificación |
