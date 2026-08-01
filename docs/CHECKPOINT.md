# CHECKPOINT

FECHA: 2026-08-01
FASE ACTIVA: PUBLIC-UI
SUBFASE: Contrato de Registro Público

## Último hito cerrado: PUBLIC-REGISTRATION-CONTRACT
Resultado: COMPLETED
PR: #4
MERGE_COMMIT: f3f6d4f69856686286e5d8eda3efcbb920653120
VALIDATION: 114/114 tests PASS
BUILD: clean verify PASS
NEXT_TASK: PUBLIC-REGISTRATION-UI

- develop/zenthera-core está en f3f6d4f69856686286e5d8eda3efcbb920653120.
- El contrato backend de términos ya está disponible.
- El frontend todavía no envía `terminosAceptados`.
- El próximo trabajo debe partir del develop actualizado.
- El rol debe seguir siendo controlado por backend.
- No debe añadirse selección de rol en el formulario.
- `confirmPassword` continúa siendo un campo solo de UI.
- Los nuevos campos persistentes deben implementarse de extremo a extremo.

## Hito previo cerrado: PUBLIC-UI
Resultado: IMPLEMENTED: YES, TESTED: YES, INSPECTOR_APPROVED: YES, ATLAS_CLOSED: YES, COMMITTED: YES, PUSHED: NO

FUNCTIONAL_COMMIT:
e24e146d0b4315b1cfed5025348a2f132ab95a8a

FUNCTIONAL_COMMIT_MESSAGE:
feat(public-ui): add public authentication flows

### Validaciones reales
- Vitest: 112/112 PASS
- Build frontend: PASS
- Playwright dirigido: 2/2 PASS
- Playwright secuencial: 4/4 PASS
- Login aislado: PASS
- Retries: 0
- Workers: 1
- Token retirado de URL: VERIFIED
- ADMIN_CLINICA: VERIFIED
- Dashboard: VERIFIED
- Datos residuales: 0
- Fixtures Alpha y Beta: intactos
- PUBLIC_UI_REGRESSIONS: NO

La suite E2E completa no pasó y no fue utilizada como gate final.
Los fallos privados detectados son preexistentes y corresponden a deuda backend fuera del alcance de PUBLIC-UI.

## Estado base histórico
BASE_BRANCH: develop/zenthera-core
BASE_HEAD: c5649050c3f51255e419ccd3228eff10b93da617

## Estado actual del trabajo PUBLIC-UI
CURRENT_WORKTREE: C:\Users\usuario1\Desktop\ZENTHERA-public-ui
CURRENT_BRANCH: feat/public-ui-foundation
CURRENT_HEAD: e24e146d0b4315b1cfed5025348a2f132ab95a8a

## Verificaciones finales del hito (2026-07-28)
- Vitest: 103 passed (0 failures, 0 skipped).
- TypeScript: PASS.
- frontend build: PASS.
- Playwright individual: 1 passed (duración reportada: 4.6 s).
- Playwright de estabilidad secuencial: 2 passed.
  - Comando de estabilidad: `--repeat-each=2 --workers=1`
  - Playwright failures: 0
  - Playwright skipped: 0
  - Retries utilizados: 0
  - Timeouts modificados: NO
  - *Aclaración expresa:* La ejecución con `--repeat-each=2 --workers=1` demuestra estabilidad secuencial y no concurrencia simultánea.
- Limpieza residual E2E:
  - Administradores residuales: 0
  - Clínicas residuales: 0
  - activation_tokens residuales: 0
  - Roles residuales: 0
  - Fixture Alpha: intacta
  - Fixture Beta: intacta
  - Conteos de fixtures antes y después: sin cambios.

## Último slice cerrado: Autenticación (Auth)
Resultado: APROBADO Y CERRADO formalmente el 2026-07-12.

## Verificaciones finales del slice Auth
- mvn test (backend H2): BUILD SUCCESS
- Flyway validate (V1–V4): OK sin repair
- npm run lint: 0 errores, 0 advertencias
- npx vitest run: 8/8 pruebas unitarias
- npm run build: compilado exitosamente (4 rutas prerenderizadas)
- npx playwright test --workers=1: 6/6 pruebas E2E en Chromium

## Últimas migraciones aplicadas
- V1__baseline.sql
- V2__create_pacientes.sql
- V3__create_medicos.sql
- V4__refresh_tokens.sql
- V5__onboarding_clinicas.sql

## Último endpoint creado
- POST /api/v1/admin/clinicas (SUPER_ADMIN)
- PUT /api/v1/admin/clinicas/{id}/estado (SUPER_ADMIN - Suspensión lógica)
- PUT /api/v1/clinica/configuracion (ADMIN_CLINICA)

## Última migración
V5__onboarding_clinicas.sql — Transaccional onboarding, auditoría inmutable de estados de clínica, constraints para zona_horaria y chequeos de estado.

## Estado del frontend
- zenthera-frontend inicializado con Next.js 16.2 (App Router), TypeScript, Tailwind CSS
- Zustand (authStore) con clinicaNombre en UserProfile
- Axios con interceptor anti-concurrencia (failedQueue + initPromise)
- AuthProvider con patrón Singleton para evitar doble refresh bajo Strict Mode
- Login (/login), Dashboard (/dashboard) con accesibilidad (htmlFor/id/name/autoComplete)
- Playwright configurado en playwright.config.ts con suite E2E completa

## Reglas activas
- Monolito modular. No iniciar microservicios.
- No avanzar al siguiente módulo hasta que el plan arquitectónico de Clínicas sea aprobado.
- Las fixtures E2E (E2eFixtureInitializer) solo se ejecutan bajo el perfil Spring "e2e".
- No guardar credenciales reales en Git.

## Último slice cerrado: Pacientes
Resultado: APROBADO Y CERRADO formalmente el 2026-07-21.

## Próximo paso recomendado
Preparar revisión del diff y commit funcional de PUBLIC-UI. Después, reabrir y priorizar las tareas backend en trabajo separado.
