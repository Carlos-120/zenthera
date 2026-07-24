# Reporte Builder — QA-CITAS-001

Fecha: 2026-07-22
Estado: BLOCKED

## Cambios

- `E2eFixtureInitializer`: usuarios por rol, médicos vinculados por cédula/tenant, pacientes Alpha/Beta y pools temporales idempotentes.
- `playwright.config.ts`: retries fijados en 0 local y CI.
- `e2e/citas.spec.ts`: 13 pruebas E2E independientes sobre backend/frontend reales.

## Evidencia

- `./mvnw.cmd clean test`: BUILD SUCCESS; 62 tests, 0 failures, 0 errors, 0 skipped.
- `npm run build`: compilación exitosa; 17 páginas generadas.
- Playwright sin `skip`, `fixme`, `only`, `waitForTimeout`, contraseña fallback, `clinicaId` ni IDs fijos.
- Fixture observado tras múltiples arranques: 6 cuentas principales, 15 médicos y 16 pacientes base/temporales; 0 claves naturales duplicadas.

## Bloqueantes

1. `GET /api/v1/clinica/citas` responde `PageResponse` sin envoltorio, mientras el cliente usa `data.data.content`.
2. `mapToListResponse` omite `createdAt`.
3. El modal de estado no coloca el foco inicial en su primer control.

No se corrigieron porque la autorización de QA prohíbe modificar frontend funcional, controladores y servicios productivos.
