# BACK-USUARIOS-ROLES-001

Status: COMPLETED
Owner: Builder
Type: Backend
Priority: High
Created: 2026-07-20
Reason: Subtarea bloqueante para FRONT-USUARIOS-001. Los IDs de rol hardcodeados en el frontend son inseguros y desalineables entre entornos.

## Objective
Implementar el endpoint `GET /api/v1/clinica/roles` que devuelva únicamente los roles asignables por un `ADMIN_CLINICA`, para que el frontend pueda obtenerlos dinámicamente sin depender de IDs hardcodeados.

## Contract

### GET /api/v1/clinica/roles
**Rol Autorizado:** `ADMIN_CLINICA`
**Descripción:** Devuelve la lista de roles que un ADMIN_CLINICA puede asignar al crear o editar un usuario.
**Request Body:** N/A
**Query Params:** N/A

**Response Body (200 OK):**
```json
{
  "success": true,
  "message": "Roles disponibles",
  "data": [
    { "id": 2, "nombre": "MEDICO" },
    { "id": 3, "nombre": "RECEPCIONISTA" }
  ]
}
```

## Roles incluidos
- `MEDICO`
- `RECEPCIONISTA`

## Restricciones absolutas
- NO devolver `SUPER_ADMIN`.
- NO devolver `ADMIN_CLINICA`.
- NO recibir `clinicaId` como parámetro.
- NO modificar ningún rol existente.
- NO implementar CRUD de roles.
- NO crear pantallas de frontend como parte de esta tarea.

## Acceptance Criteria
1. El endpoint responde con `200 OK` y solo incluye `MEDICO` y `RECEPCIONISTA`.
2. Solo `ADMIN_CLINICA` puede acceder.
3. Cualquier otro rol recibe `403 Forbidden`.
4. Sin autenticación recibe `401 Unauthorized`.
5. Prueba de integración que valide los 4 puntos anteriores.
6. El build del backend pasa sin errores.
