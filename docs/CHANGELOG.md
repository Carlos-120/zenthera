# CHANGELOG

## 2026-07-12 — Backend del Vertical Slice Clínicas Completado

### Cambios
**Backend:**
- Implementado MethodSecurity (`@EnableMethodSecurity`) con protección rigurosa por roles (`@PreAuthorize("hasRole('SUPER_ADMIN')")` y `hasRole('ADMIN_CLINICA')`).
- Endpoints de `ClinicaController` (SUPER_ADMIN) y `ClinicaConfigController` (ADMIN_CLINICA) separados para evitar escalada de privilegios.
- Refactorización de tests de integración para limpiar adecuadamente repositorios (`refreshTokenRepository`) y evitar bloqueos en H2.
- Resolución de regresiones JWT: control de excepciones SQL para bloqueos concurrentes H2 en `AuthServiceImpl`, retornando `BadCredentialsException` manejada correctamente a 401 por `GlobalExceptionHandler`.
- Flujo de creación transaccional (Clínica + Admin inactivo) en un solo commit.
- Servicio `NotificationService` con tokens opacos generados de un solo uso para activación de cuenta, loggeados solo en el entorno local/desarrollo, pero asegurados criptográficamente para producción (almacenando solo el Hash).
- Historial de cambios de estado inmutable (`auditoria_estado_clinicas`), garantizado mediante el backend.

**Base de Datos:**
- Migración `V5__onboarding_clinicas.sql`:
    - Tablas `auditoria_estado_clinicas` y `activation_tokens`.
    - Ajuste de columna `zona_horaria` a `NOT NULL`.
    - Añadidas restricciones `CHECK` para auditoría (no vacío, cambio real).

### Resultados de Pruebas Finales
| Suite | Resultado |
|---|---|
| mvn test (H2) | BUILD SUCCESS (24/24) |
| Flyway validate V1–V5 | OK |

### Decisión
Backend de Clínicas validado. Próximo paso: comenzar el Frontend para Clínicas (Onboarding y Configuración).

---

## 2026-07-12 — Cierre del Vertical Slice de Autenticación

### Cambios
**Backend:**
- Implementado sistema completo de Refresh Token con rotación y detección de reutilización.
- Migración V4__refresh_tokens.sql: tabla refresh_tokens con hash SHA-256 y revocación por familia.
- Endpoints finalizados: POST /login, POST /refresh, GET /me, POST /logout.
- AuthenticationEntryPoint y AccessDeniedHandler retornan JSON uniforme (ApiResponse).
- TenantContext con ThreadLocal y limpieza garantizada.
- Aislamiento multi-tenant: filtros por clinicaId directamente en consultas JPQL.
- apply_v4.ps1: script seguro con SecureString, respaldo con pg_dump -f, try/finally.

**Frontend:**
- Scaffolding Next.js 16.2 (App Router), TypeScript, Tailwind CSS.
- Zustand authStore: AccessToken + UserProfile (incluye clinicaNombre) en memoria volátil.
- Axios con interceptor anti-concurrencia (failedQueue + isRefreshing).
- AuthProvider con initPromise Singleton para Strict Mode.
- Login: separación explícita POST /login → GET /me antes de setAuth.
- Dashboard: muestra clinicaNombre (no ID interno). Logout resiliente (no limpia estado local si falla el backend).
- Accesibilidad: htmlFor, id, name, autoComplete en inputs. role="alert" en errores.
- vitest.config.ts: include/exclude para separar specs de Playwright de los tests unitarios.
- playwright.config.ts: suite E2E completa en Chromium.

**E2E Fixtures (perfil e2e):**
- E2eFixtureInitializer: ApplicationRunner @Order(10), @Transactional, @Profile("e2e").
- Dos clínicas (Alpha / Beta) con médicos de cédulas únicas E2E0000001 / E2E0000002.
- Contraseña desde E2E_PASSWORD (variable de entorno, nunca en Git).

**Documentación:**
- zenthera-docs/architecture/AUTH_E2E.md: arquitectura E2E, instrucciones de ejecución.
- implementation_plan.md: plan de Fase 7 guardado en raíz del repositorio.

### Resultados de Pruebas Finales
| Suite | Resultado |
|---|---|
| mvn test (H2) | BUILD SUCCESS |
| Flyway validate V1–V4 | OK |
| ESLint | 0 errores, 0 advertencias |
| Vitest | 8/8 |
| Build Next.js | Exitoso |
| Playwright E2E | 6/6 |

### Decisión
Slice Auth aprobado y cerrado formalmente.
Siguiente: slice Clínicas — pendiente de aprobación del plan arquitectónico.

---

## 2026-07-11 — Reorganización metodológica + Backend base

### Cambios
- Adoptada metodología Vertical Slice Architecture.
- Creados documentos de continuidad en /docs.
- MedicoController: CRUD REST completo con validación de cédula duplicada.
- PacienteController: CRUD REST normalizado con ApiResponse.
- pom.xml alineado a Java 21, versiones centralizadas en propiedades Maven.

### Resultados
- mvn test: BUILD SUCCESS, 1 test ejecutado.

---
