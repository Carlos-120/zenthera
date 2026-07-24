# QA-USUARIOS-001

Status: IN_PROGRESS
Owner: Builder
Type: QA
Priority: Medium

## Objective
Pruebas E2E en Playwright y revisión de accesibilidad del módulo de Usuarios.

## Scope
- Simular sesión con ADMIN_CLINICA (Alpha).
- Validar flujo de creación de un MEDICO nuevo.
- Validar modificación de estado del usuario creado (Activar/Desactivar).
- Intentar acceder con el MEDICO creado.
- Intentar vulnerar el aislamiento multi-tenant verificando que Alpha no ve usuarios de Beta.
- Verificar accesibilidad en formularios de usuarios (modales con focus trap, roles ARIA y labels).
