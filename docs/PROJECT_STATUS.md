# PROJECT STATUS

Fase activa: Clínicas (Completada, esperando aprobación final)
Porcentaje completado: ~45%
Fecha: 2026-07-29
Ultima actualización: 2026-07-29

## Resumen ejecutivo
Zenthera es una plataforma SaaS para gestión administrativa de clínicas privadas.
Arquitectura: Monolito modular (Spring Boot + Next.js). Desarrollo por Vertical Slice.
Regla principal: cerrar backend, frontend, integración, pruebas y documentación de una funcionalidad antes de avanzar.

---

## Slice Auth — CERRADO Y APROBADO (2026-07-12)

### Backend
- Login con JWT (Access Token 15 min + Refresh Token 7 días).
- Tabla refresh_tokens (V4): hash SHA-256, revocación por familia, detección de reutilización.
- Endpoints: POST /login, POST /refresh, GET /me, POST /logout.
- SecurityConfig con CORS estricto, AuthenticationEntryPoint y AccessDeniedHandler JSON.
- Aislamiento multi-tenant: clinicaId extraído del usuario autenticado, filtros en consultas SQL.
- TenantContext en ThreadLocal, limpieza garantizada en éxito y error.

### Frontend
- Next.js 16.2 (App Router), TypeScript, Tailwind CSS, Axios, TanStack Query, Zustand.
- Access token en memoria (Zustand). Refresh token en cookie HttpOnly.
- AuthProvider con initPromise Singleton para evitar doble refresh bajo React Strict Mode.
- Interceptor Axios con failedQueue para concurrencia de 401.
- Formulario de login con accesibilidad completa (htmlFor, id, name, autoComplete, role="alert").
- Dashboard muestra clinicaNombre (no el ID interno).
- Logout solo limpia estado local si el backend confirma éxito.

### Base de datos
- PostgreSQL + Flyway V1–V4 aplicadas y validadas.
- refresh_tokens con FK a usuarios, índice único por token_hash, índices por usuario y familia.

### Pruebas
| Suite | Resultado |
|---|---|
| mvn test (H2) | BUILD SUCCESS |
| Flyway validate | OK — sin repair |
| ESLint | 0 errores |
| Vitest (unitarios) | 8/8 |
| Build Next.js | Exitoso |
| Playwright E2E | 6/6 |

### Pruebas E2E cubiertas
1. Credenciales incorrectas → role="alert" con texto exacto.
2. Login correcto → dashboard con nombre de clínica.
3. Ruta protegida sin sesión → redirect /login.
4. Recarga (F5) → restauración de sesión via refresh token.
5. Aislamiento multi-tenant (Alpha ≠ Beta).
6. Logout → limpieza de sesión + bloqueo de retorno.

### Infraestructura E2E
- E2eFixtureInitializer: @Profile("e2e"), ApplicationRunner @Order(10), @Transactional.
- Cédulas únicas: Alpha=E2E0000001, Beta=E2E0000002.
- Lee contraseña desde E2E_PASSWORD (nunca hardcodeado).
- Upsert idempotente: actualiza password, clínica, rol, activo, bloqueado, cambiarPassword.

---

## Slice Clínicas — CERRADO Y APROBADO (2026-07-20)

### Backend
- Endpoints implementados para listado global, creación y cambio de estado (SUPER_ADMIN).
- Configuración local de clínicas (ADMIN_CLINICA).
- 40 pruebas de integración ejecutadas, 40 aprobadas, 0 fallos, 0 errores. BUILD SUCCESS.

### Frontend
- NPM run build exitoso.
- Listado, detalle y creación de clínicas (`/admin/clinicas`).
- Configuración local (`/dashboard/mi-clinica`).

### E2E
- 3 ejecuciones independientes de la suite E2E en Playwright.
- 7/7 pruebas aprobadas en cada ejecución (21/21 acumuladas). 0 fallos.

Estado: Vertical lista para aprobación final de Carlos.
Riesgos bloqueantes: ninguno identificado dentro del alcance validado.

## Slice Usuarios — CERRADO Y APROBADO (2026-07-20)

### Backend
- Endpoints CRUD implementados: GET listado (paginado, búsqueda, ordenamiento), POST creación, PUT edición (sin password obligatorio), PATCH estado.
- Endpoint `GET /api/v1/clinica/roles` para cargar dinámicamente MEDICO y RECEPCIONISTA.
- Seguridad y Aislamiento (TenantContext): No se expone `clinicaId` en ningún payload (ni en request ni response se usa para control de acceso, sino mediante el JWT del usuario autenticado).
- 57 pruebas ejecutadas, 57 aprobadas, 0 fallos, 0 errores. BUILD SUCCESS.

### Frontend
- NPM run build exitoso.
- Listado, búsqueda y filtros.
- Formularios accesibles para Creación y Edición (Zod schemas estrictos).
- Modal para confirmar desactivación de usuarios (sin `alert()`).
- Consumo dinámico de roles en formularios.
- Bloqueo 403 a usuarios con rol MEDICO o RECEPCIONISTA (RoleGuard) al dashboard de usuarios.

### E2E
- 3 ejecuciones consecutivas independientes de la suite E2E en Playwright (entorno inicializado con E2eFixtureInitializer).
- 7/7 pruebas aprobadas en cada ejecución (21/21 acumuladas). 0 fallos, 0 omitidas.

### Mejoras Futuras Identificadas (No bloqueantes)
- Evaluar separación del DTO `UsuarioRequest` en `UsuarioCreateRequest` y `UsuarioUpdateRequest`.

## Slice Registro Público de Clínicas — CERRADO Y APROBADO (2026-07-28)

### Alcance Funcional
- Hito: Registro público, activación y acceso inicial de clínicas (COMPLETED / CLOSED / VALIDATED).
- Acceso público a `/registro` con formulario de registro de clínica.
- Creación de la clínica y creación del primer `ADMIN_CLINICA`.
- Administrador inicialmente inactivo y bloqueo del login antes de activar.
- Activación mediante token y posterior login correcto (verificación mediante `/api/v1/auth/me`).
- Rol `ADMIN_CLINICA` confirmado y acceso al dashboard habilitado.
- Rutas `/dashboard` y `/admin` protegidas; `/login`, `/activate` y `/registro` públicas.
- Mensaje de registro exitoso y redirección segura a `/login?registered=1`.
- Ausencia de información personal en la URL de registro.

### Seguridad e Infraestructura E2E
- Infraestructura E2E exclusiva para pruebas con perfil Spring `e2e`.
- Activación únicamente con configuración E2E habilitada y clave obtenida de variables de entorno (sin valores secretos predeterminados).
- Validaciones de endpoint protegido: sin clave (403), clave incorrecta (403), clave válida sin token disponible (404), token de un solo uso (segundo consumo 404).
- Token no registrado en logs.
- Infraestructura deshabilitada fuera del entorno E2E.

### Limpieza Segura de Datos (PostgreSQL)
- Requiere identidad completa de ejecución (correo del administrador, RUC, correo y nombre de clínica) y marcador único.
- Bloquea usuario y clínica mediante `FOR UPDATE` (transaccional con rollback ante inconsistencias).
- Valida la existencia de un único usuario perteneciente a la ejecución, rechazando otros administradores o información ajena (pacientes, médicos, citas).
- Protege explícitamente clínicas fixture (Alpha y Beta) y no puede eliminar clínicas compartidas.
- Usa SQL parametrizado, sin `LIKE`, sin `TRUNCATE`, sin `DELETE` sin `WHERE` y verifica `rowCount`. Es idempotente y cierra el cliente PostgreSQL siempre.

### Validación y Estado
- **Commit Final:** `c1a8ee28e01cc25175289f82ef1557b0ccc2c434` (Padre: `196b68f1abe52aa287524f90b17cfd2236cee426`).
- **Estado Remoto:** Publicado correctamente en `origin/develop/zenthera-core`. Divergencia local/remoto 0 0, Push normal (no force, no rebase, no merge, main intacta).
- **Pruebas:** Vitest (103 passed, 0 failures, 0 skipped), TypeScript (PASS), Frontend build (PASS), Playwright individual (1 passed), Playwright estabilidad secuencial (2 passed con `--repeat-each=2` y `--workers=1` que demuestra estabilidad secuencial sin concurrencia simultánea, 0 failures, 0 skipped, 0 retries). Timeouts modificados: NO.
- **Limpieza Post-Pruebas:** 0 administradores residuales, 0 clínicas residuales, 0 activation_tokens residuales, 0 roles residuales. Clínicas Alpha y Beta intactas, conteos de fixtures sin cambios. Puertos 3000 y 8080 liberados. PostgreSQL no fue detenido.
- **Bloqueos actuales:** NONE. Deuda crítica: NONE. Cambios tracked pendientes después del push: 0. Archivos históricos untracked permanecen fuera del alcance.

### Archivos incluidos
- `zenthera-frontend/e2e/registro.spec.ts`
- `zenthera-frontend/e2e/helpers/activationToken.ts`
- `zenthera-frontend/e2e/helpers/database.ts`
- `zenthera-frontend/src/__tests__/databaseCleanup.test.ts`
- `zenthera-frontend/src/components/providers/AuthProvider.tsx`
- `zenthera-frontend/src/__tests__/AuthProvider.test.tsx`

## Auditoría y Reglas del Sistema

- **2026-07-20**: Se registró un incidente donde el agente Inspector modificó directamente `docs/API_CONTRACT.md` para agregar el endpoint `/api/v1/clinica/roles` (fuera de su responsabilidad). El cambio se mantuvo por ser técnicamente correcto, pero se actualizaron las reglas del Inspector (`02-inspector.md`) para prohibir terminantemente la edición directa de archivos de código o documentación en futuras revisiones.

## Deuda Backend Preexistente (Reapertura Requerida)

### BACK-CLINICAS-DETAIL-001 (GET /api/v1/admin/clinicas/{id})
STATUS: COMPLETED
VERIFICATION: VERIFIED
ENDPOINT: GET /api/v1/admin/clinicas/{id}
RESPONSE: ApiResponse<ClinicaResponse>
SECURITY: SUPER_ADMIN
NOT_FOUND: HTTP 404 mediante ResourceNotFoundException
TARGETED_TESTS: 12/12 PASS
BACKEND_TESTS: 111/111 PASS
BUILD: BUILD SUCCESS
FEATURE_COMMIT: ace179621fca5bbc7d6c351f04cbc1b14f087d35
MERGE_COMMIT: 2507b041f2c5460c0e1756987b6d98551030a6be
PR: #3 MERGED

### BACK-PACIENTES-001 (Listado tenant de pacientes con soporte para search)
PREVIOUS_DOCUMENTED_STATUS: IN_PROGRESS
CURRENT_VERIFIED_STATUS: REOPEN_REQUIRED
REASON: El alcance de búsqueda tenant mediante search sigue sin estar implementado en la rama base.

### BACK-USUARIOS-001 (GET /api/v1/clinica/usuarios)
PREVIOUS_DOCUMENTED_STATUS: COMPLETED
CURRENT_VERIFIED_STATUS: REOPEN_REQUIRED
REASON: implementación ausente en la rama base

### BACK-USUARIOS-ROLES-001 (GET /api/v1/clinica/roles)
PREVIOUS_DOCUMENTED_STATUS: COMPLETED
CURRENT_VERIFIED_STATUS: REOPEN_REQUIRED
REASON: implementación ausente en la rama base

---

## Slice PUBLIC-UI
PUBLIC_UI_STATUS: CLOSED
FUNCTIONAL_COMMIT_CREATED: YES
FUNCTIONAL_COMMIT_HASH: e24e146d0b4315b1cfed5025348a2f132ab95a8a
DOCUMENTATION_COMMIT_CREATED: NO
PUSH_PERFORMED: NO

## Historial de slices

| Slice | Estado | Fecha cierre |
|---|---|---|
| Auth (Backend + Frontend + E2E) | CERRADO | 2026-07-12 |
| Clínicas | REOPEN_REQUIRED | 2026-07-20 |
| Registro de Clínicas | CERRADO | 2026-07-28 |
| Usuarios | REOPEN_REQUIRED | 2026-07-20 |
| Pacientes (Backend) | REOPEN_REQUIRED | 2026-07-20 |
| PUBLIC-UI | CERRADO (Committed) | 2026-07-29 |
| Pacientes (Frontend + E2E) | CERRADO | 2026-07-21 |
| Médicos (backend parcial) | Pendiente frontend | — |
| Citas / Agenda | Pendiente | — |
