# FRONT-CLINICAS-001

Status: COMPLETED
Owner: Builder
Type: Frontend
Priority: High

## Objective

Crear la infraestructura de datos del frontend de Clínicas:

- DTOs
- cliente Axios
- servicios API
- esquemas Zod
- manejo básico de errores

## Scope

- Tipos y DTOs alineados con el contrato real del backend.
- Cliente HTTP reutilizable.
- Servicios para operaciones de Clínicas.
- Validaciones Zod de entradas y respuestas necesarias.
- Manejo consistente de errores.

## Out of Scope

- Pantallas.
- Componentes visuales.
- Paginación visual.
- Formularios.
- Pruebas E2E.
- Cambios en el backend.

## Required Context

- Contrato real de endpoints de Clínicas.
- DTOs del backend.
- Convenciones actuales del frontend.
- Configuración existente de Axios, si existe.
- Sistema actual de autenticación y manejo de tokens.

## Acceptance Criteria

- El frontend compila.
- Los tipos coinciden con las respuestas reales del backend.
- No se duplican clientes HTTP existentes.
- Los servicios no contienen lógica visual.
- Las validaciones Zod cubren los datos usados por el módulo.
- Los errores se transforman a un formato consistente.
- No se escriben mocks como sustituto del contrato real.

## Required Evidence

- Archivos creados y modificados.
- Comando de compilación o verificación ejecutado.
- Resultado real del comando.
- Resumen de endpoints implementados.
- Riesgos o diferencias encontradas entre frontend y backend.

## Restrictions

- No inventar campos ni endpoints.
- No modificar el backend.
- No comenzar FRONT-CLINICAS-002.
- No instalar librerías si ya existe una solución equivalente.
