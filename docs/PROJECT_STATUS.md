# PROJECT STATUS

Fase activa: Clínicas (Completada, esperando aprobación final)
Porcentaje completado: ~45%
Fecha: 2026-07-20
Ultima actualización: 2026-07-20

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

## Auditoría y Reglas del Sistema

- **2026-07-20**: Se registró un incidente donde el agente Inspector modificó directamente `docs/API_CONTRACT.md` para agregar el endpoint `/api/v1/clinica/roles` (fuera de su responsabilidad). El cambio se mantuvo por ser técnicamente correcto, pero se actualizaron las reglas del Inspector (`02-inspector.md`) para prohibir terminantemente la edición directa de archivos de código o documentación en futuras revisiones.

---

## Historial de slices

| Slice | Estado | Fecha cierre |
|---|---|---|
| Auth (Backend + Frontend + E2E) | CERRADO | 2026-07-12 |
| Clínicas | CERRADO | 2026-07-20 |
| Usuarios | CERRADO | 2026-07-20 |
| Pacientes (Backend) | CERRADO | 2026-07-20 |
| Pacientes (Frontend + E2E) | CERRADO | 2026-07-21 |
| Médicos (backend parcial) | Pendiente frontend | — |
| Citas / Agenda | Pendiente | — |
