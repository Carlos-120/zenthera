# ROADMAP

## Metodología

Vertical Slice Architecture. Cada slice cierra backend, frontend, integración, pruebas y documentación antes de iniciar el siguiente. Arquitectura: monolito modular (sin microservicios).

Estados válidos: `Pendiente` | `En planificación` | `En progreso` | `Completado`

---

## Slice 1 — Autenticación ✅ COMPLETADO (2026-07-12)

Scope cerrado:
- JWT (Access 15 min + Refresh 7 días en cookie HttpOnly).
- Rotación y detección de reutilización de Refresh Tokens (V4).
- Endpoints: POST /login, POST /refresh, GET /me, POST /logout.
- Aislamiento multi-tenant por clinicaId en consultas SQL.
- Frontend: Next.js, Zustand, Axios interceptor, AuthProvider, Login, Dashboard.
- E2E: Playwright 6/6 en Chromium. Vitest 8/8. ESLint 0 errores.

---

## Slice 2 — Clínicas 🟡 EN PROGRESO (Backend con correcciones pendientes)

Enfoque: onboarding, configuración y aislamiento multi-clínica.
Estado: 4 bloqueantes activos. Frontend bloqueado.

Alcance actual:
- Backend: CERRADO. Endpoints de gestión de clínica propia (lectura/edición de datos de la clínica del usuario autenticado). SUPER_ADMIN: listar, crear, activar/desactivar clínicas (Onboarding transaccional). Historial de estado inmutable.
- Frontend: página de configuración de clínica, vista de perfil de clínica.
- Aislamiento: garantizar que ningún rol acceda a datos de otra clínica.
- Pruebas: unitarias, integración y E2E de flujos de clínica.
- Documentación: API_CONTRACT, DATABASE actualizado.

---

## Slice 3 — Usuarios

Estado: Pendiente
Dependencia: Slice 2 (Clínicas)

Alcance previsto:
- CRUD de usuarios de la clínica (ADMIN_CLINICA gestiona su propia clínica).
- Roles: ADMIN_CLINICA, MEDICO, RECEPCIONISTA.
- Cambio de contraseña, activación/desactivación.

---

## Slice 4 — Pacientes

Estado: Backend parcial (sin frontend ni pruebas E2E)
Dependencia: Slice 3 (Usuarios)

Pendiente:
- Revisar seguridad y permisos por rol.
- Frontend: listado, búsqueda, paginación, CRUD.
- Pruebas E2E.

---

## Slice 5 — Médicos

Estado: Backend parcial (sin frontend ni pruebas E2E)
Dependencia: Slice 3 (Usuarios)

Pendiente:
- Frontend: listado, búsqueda, paginación, CRUD.
- Especialidades vinculadas.
- Pruebas E2E.

---

## Slice 6 — Agenda y Citas

Estado: Pendiente
Dependencia: Slices 4 y 5

---

## Slice 7 — Dashboard y Reportes

Estado: Pendiente
Dependencia: Slices 1–6

---

## Slice 8 — Módulos Premium

Estado: Pendiente
Incluye: Facturación, Inventario, Reportes avanzados, Página web pública, IA clínica.
