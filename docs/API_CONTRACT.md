# API CONTRACT

Versión: 1.1.0
Última actualización: 2026-07-12
Estado Auth Slice: CERRADO Y APROBADO

---

## Convenciones generales

### Versionado
Todas las rutas usan el prefijo `/api/v1/`. La ruta legacy `/api/auth` está eliminada.

### Formato de respuesta universal (ApiResponse)

```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { },
  "errors": null,
  "timestamp": "2026-07-12T03:00:00Z"
}
```

Todos los endpoints — incluyendo errores 401, 403, 500 — retornan este formato.

### Códigos HTTP
| Código | Significado |
|---|---|
| 200 | Operación exitosa |
| 400 | Validación o sintaxis |
| 401 | No autenticado / token expirado |
| 403 | Autenticado sin permisos |
| 409 | Conflicto de estado |
| 500 | Error no controlado |

---

## Módulo Auth — `/api/v1/auth`

### POST /login
**Público.**
Autentica al usuario, devuelve accessToken en body y refreshToken en cookie HttpOnly.

Request:
```json
{ "correo": "medico@clinica.com", "password": "secreto" }
```

Response 200:
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "accessToken": "eyJ...",
    "usuario": {
      "id": 1,
      "nombres": "Juan",
      "apellidos": "Pérez",
      "correo": "medico@clinica.com",
      "rol": "MEDICO",
      "clinicaId": 5,
      "clinicaNombre": "Clínica Central"
    }
  }
}
```

Cookie: `refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`

> ⚠ El frontend NO usa `data.usuario` del login. Después de obtener el accessToken, hace GET /me para obtener el perfil completo.

---

### POST /refresh
**Público. Requiere cookie refreshToken válida.**
Rota el refresh token y devuelve nuevo accessToken. Si se detecta reutilización de un token revocado, toda la familia se invalida.

Response 200:
```json
{
  "success": true,
  "data": { "accessToken": "eyJ..." }
}
```

---

### GET /me
**Requiere Bearer accessToken.**
Devuelve el perfil completo del usuario autenticado.

Response 200:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombres": "Juan",
    "apellidos": "Pérez",
    "correo": "medico@clinica.com",
    "rol": "MEDICO",
    "clinicaId": 5,
    "clinicaNombre": "Clínica Central"
  }
}
```

---

### POST /logout
**Requiere Bearer accessToken (tolerante a expirado si hay cookie válida).**
Revoca el refresh token activo y toda su familia. Emite cookie con Max-Age=0.

---

## Matriz de autorización — Auth

| Endpoint | SUPER_ADMIN | ADMIN_CLINICA | MEDICO | RECEPCIONISTA | Anónimo |
|---|:---:|:---:|:---:|:---:|:---:|
| POST /login | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /refresh | ✅ | ✅ | ✅ | ✅ | ✅ (cookie) |
| GET /me | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /logout | ✅ | ✅ | ✅ | ✅ | ❌ |

> SUPER_ADMIN no tiene acceso transversal automático a datos de otras clínicas. Requiere selección explícita de clínica y permisos adicionales.

---

## Módulo Clínicas (Configuración y Gestión)

Estado: CERRADO Y APROBADO (Backend y Frontend completados y probados con E2E).

### POST /api/v1/admin/clinicas
**Requiere rol SUPER_ADMIN.**
Crea una nueva clínica y a su administrador inicial (onboarding transaccional).
Se envía internamente un token de activación al correo del administrador.

Request: `OnboardingClinicaRequest` (Nombre, RUC, Dirección, Administrador, etc.)

### GET /api/v1/admin/clinicas
**Requiere rol SUPER_ADMIN.**
Lista paginada de todas las clínicas del sistema.

### GET /api/v1/admin/clinicas/{id}
**Requiere rol SUPER_ADMIN.**
Obtiene el detalle completo de una clínica por ID.

### PUT /api/v1/admin/clinicas/{id}/estado
**Requiere rol SUPER_ADMIN.**
Suspende o reactiva una clínica. Invalida todas las sesiones de usuarios de dicha clínica si es suspendida.
Registra el evento inmutablemente en el historial de auditoría.
Request: `EstadoClinicaRequest` (activo, motivo).

### GET /api/v1/clinica/configuracion
**Requiere rol ADMIN_CLINICA.**
Obtiene la configuración general de la clínica a la que pertenece el usuario autenticado (extraído automáticamente de su JWT / Tenant).

### PUT /api/v1/clinica/configuracion
**Requiere rol ADMIN_CLINICA.**
Actualiza la configuración de la clínica del usuario (Nombre comercial, logo, teléfono, etc. - El RUC y estado no son modificables por este endpoint).
Request: `ClinicaConfigRequest`.

---

## Matriz de autorización — Clínicas

| Endpoint | SUPER_ADMIN | ADMIN_CLINICA | MEDICO | RECEPCIONISTA |
|---|:---:|:---:|:---:|:---:|
| Todas las rutas `/api/v1/admin/clinicas/**` | ✅ | ❌ | ❌ | ❌ |
| Todas las rutas `/api/v1/clinica/**` | ❌ | ✅ | ❌ | ❌ |

---

## Módulo Usuarios — `/api/v1/clinica/usuarios`

Gestión de usuarios dentro del alcance de una clínica específica.
> ⚠ **Alcance:** El restablecimiento de contraseñas queda temporalmente fuera de alcance.

### GET /api/v1/clinica/usuarios
**Rol Autorizado:** `ADMIN_CLINICA`
**Descripción:** Listado paginado de los usuarios pertenecientes a la clínica del administrador autenticado.
**Query Params:**
- `page` (opcional): Número de página.
- `size` (opcional): Tamaño de página. **Máximo permitido: 50**.
- `search` (opcional): Busca coincidencias por `nombres`, `apellidos`, `cédula` o `correo`.
- `activo` (opcional): Filtra por estado (true/false).
- `rolId` (opcional): Filtra usuarios con un rol específico.
- `sort` (opcional): Criterio de ordenamiento (sujeto a un **whitelist** estricto de campos permitidos).
**Request Body:** N/A.
**Response Body (200 OK):**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": [
    {
      "id": 1,
      "clinicaId": 5,
      "nombreClinica": "Clínica Central",
      "rolId": 2,
      "nombreRol": "MEDICO",
      "nombres": "Juan",
      "apellidos": "Pérez",
      "cedula": "1234567890",
      "telefono": "0999999999",
      "correo": "juan@clinica.com",
      "foto": "url_foto.jpg",
      "activo": true,
      "bloqueado": false,
      "cambiarPassword": false,
      "ultimoLogin": "2026-07-20T10:00:00",
      "createdAt": "2026-07-10T10:00:00",
      "updatedAt": "2026-07-10T10:00:00"
    }
  ]
}
```

---

### GET /api/v1/clinica/roles
**Rol Autorizado:** `ADMIN_CLINICA`
**Descripción:** Devuelve la lista de roles que un administrador de clínica puede asignar al crear o editar un usuario.
**Request Body:** N/A.
**Respuestas y Errores Esperados:**
- `200 OK`: Retorna `ApiResponse<List<RolResponse>>`.
- `401 Unauthorized`: No autenticado.
- `403 Forbidden`: Acceso denegado (rol incorrecto).
**Reglas Obligatorias:**
- Solo incluye los roles subordinados permitidos (por ejemplo, `MEDICO`, `RECEPCIONISTA`).
- No incluye `SUPER_ADMIN` ni `ADMIN_CLINICA`.
**Respuestas y Errores Esperados:**
- `200 OK`: Lista paginada envuelta en `ApiResponse`.
- `401 Unauthorized`: No autenticado.
- `403 Forbidden`: Sin permisos para esta ruta.

---

### GET /api/v1/clinica/usuarios/{id}
**Rol Autorizado:** `ADMIN_CLINICA`
**Descripción:** Obtiene los detalles de un usuario específico dentro de la clínica.
**Request Body:** N/A.
**Respuestas y Errores Esperados:**
- `200 OK`: Retorna `ApiResponse<UsuarioResponse>` si el usuario existe y pertenece al tenant actual.
- `401 Unauthorized`: No autenticado.
- `403 Forbidden`: Acceso denegado (rol incorrecto).
- `404 Not Found`: Si el usuario no existe o pertenece a **otra clínica** (respuesta unificada para evitar enumeración de usuarios foráneos).
**Reglas Obligatorias y Tenant:**
- El acceso está restringido exclusivamente a `ADMIN_CLINICA`.
- Aislamiento absoluto mediante `TenantContext`. Queda prohibido exponer o aceptar `clinicaId` como medio para acceder a registros; el sistema siempre validará internamente que el ID solicitado corresponda a la clínica autenticada.

---

### POST /api/v1/clinica/usuarios
**Rol Autorizado:** `ADMIN_CLINICA`
**Descripción:** Crea un nuevo usuario en la clínica del administrador.
**Request Body:**
```json
{
  "rolId": 2,
  "nombres": "Ana",
  "apellidos": "López",
  "cedula": "0987654321",
  "telefono": "0988888888",
  "correo": "ana@clinica.com",
  "password": "Password123!",
  "foto": "url_foto.jpg"
}
```
> ⚠ **DTO a Refactorizar:** El actual `UsuarioRequest` debe ser refactorizado o reemplazado debido a que `clinicaId` no puede seguir siendo obligatorio en el payload. `clinicaId` NUNCA se acepta en ningún payload.

**Respuestas y Errores Esperados:**
- `201 Created`: Retorna el objeto `UsuarioResponse` dentro de `ApiResponse`.
- `400 Bad Request`: Errores de validación.
- `401 Unauthorized`: Token inválido o expirado.
- `403 Forbidden`: Si no es ADMIN_CLINICA o intenta asignar un rol no permitido (ej. SUPER_ADMIN).
- `409 Conflict`: Correo o cédula ya registrados en el sistema.
**Reglas Obligatorias y Tenant:**
- El ID de clínica se obtiene SIEMPRE desde el `TenantContext`.
- El `ADMIN_CLINICA` solo puede asignar roles subordinados permitidos (ej. `MEDICO`, `RECEPCIONISTA`).
- Está estrictamente prohibido elevar privilegios asignando `SUPER_ADMIN` o creando otro `ADMIN_CLINICA`.

---

### PUT /api/v1/clinica/usuarios/{id}
**Rol Autorizado:** `ADMIN_CLINICA`
**Descripción:** Edita los datos de un usuario existente.
**Request Body:**
- **No es idéntico al POST.**
- `password` es **opcional** en PUT (a diferencia de POST, que lo exige). Si `password` no se envía, la contraseña actual se conserva.
- PUT **no permite** enviar `clinicaId` ni `bloqueado`.
- Los demás campos deben seguir las reglas de edición aprobadas.
**Respuestas y Errores Esperados:**
- `200 OK`: Retorna el `UsuarioResponse` modificado dentro de `ApiResponse`.
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`: Si el `{id}` no existe o si el ID pertenece a otra clínica, respondiendo así para evitar enumeración.
- `409 Conflict`: Conflicto en atributos únicos (correo, cédula).
**Reglas Obligatorias y Tenant:**
- **No acepta** `clinicaId` y **no permite** mover al usuario a otra clínica.
- El usuario objetivo debe pertenecer al tenant actual (clínica).
- Aplican las mismas reglas de asignación de roles de POST: solo puede asignar roles subordinados permitidos, no puede elevar a `SUPER_ADMIN` ni `ADMIN_CLINICA`.
- **Restricción de autogestión destructiva:** Un administrador no puede degradarse a sí mismo a un rol subordinado ni puede desactivarse mediante este endpoint si es el único en su clínica.
- **Prohibición de orfandad:** Está terminantemente prohibido desactivar o degradar al último `ADMIN_CLINICA` activo de la clínica.

---

### PATCH /api/v1/clinica/usuarios/{id}/estado
**Rol Autorizado:** `ADMIN_CLINICA`
**Descripción:** Suspende o reactiva lógicamente a un usuario.
**Request Body (Propiedad canónica única):**
```json
{
  "activo": false
}
```
**Respuestas y Errores Esperados:**
- `200 OK`: `ApiResponse` confirmando éxito o devolviendo el `UsuarioResponse` con su nuevo estado.
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`: Si el usuario no existe o pertenece a otra clínica (para evitar enumeración).
**Aclaraciones sobre el estado:**
- La propiedad `activo` controla la habilitación administrativa del usuario en el sistema.
- El campo `bloqueado` queda reservado exclusivamente al sistema de seguridad/autenticación; este endpoint **no modifica** `bloqueado`.
- No se requiere enviar motivo en esta versión porque no existe un historial de auditoría aprobado para usuarios.
**Reglas Obligatorias de Estado:**
- **Autodesactivación prohibida:** El administrador que realiza la petición NO puede suspenderse (desactivarse) a sí mismo.
- **Prohibición de desactivar al último ADMIN_CLINICA:** El sistema debe impedir la suspensión si el usuario objetivo es el último `ADMIN_CLINICA` activo de la institución.

---

## Matriz de autorización — Usuarios

| Endpoint | SUPER_ADMIN | ADMIN_CLINICA | MEDICO | RECEPCIONISTA |
|---|:---:|:---:|:---:|:---:|
| `GET /api/v1/clinica/usuarios` | ❌ | ✅ | ❌ | ❌ |
| `GET /api/v1/clinica/usuarios/{id}` | ❌ | ✅ | ❌ | ❌ |
| `POST /api/v1/clinica/usuarios` | ❌ | ✅ | ❌ | ❌ |
| `PUT /api/v1/clinica/usuarios/{id}` | ❌ | ✅ | ❌ | ❌ |
| `PATCH /api/v1/clinica/usuarios/{id}/estado` | ❌ | ✅ | ❌ | ❌ |
| `GET /api/v1/clinica/roles` | ❌ | ✅ | ❌ | ❌ |

> **Reglas de Acceso Estrictas:**
> - **SUPER_ADMIN**: sin acceso a estas rutas locales (deben gestionar a nivel global/admin).
> - **ADMIN_CLINICA**: autorizado exclusivamente para gestionar a los usuarios de su propia clínica.
> - **MEDICO** y **RECEPCIONISTA**: no autorizados.

---

## Módulo Pacientes — `/api/v1/clinica/pacientes`

Gestión integral de pacientes adscritos a una clínica específica.

### GET /api/v1/clinica/pacientes
**Roles Autorizados:** `ADMIN_CLINICA`, `MEDICO`, `RECEPCIONISTA`
**Descripción:** Listado paginado de pacientes pertenecientes a la clínica.
**Query Params:**
- `page` (opcional): Número de página.
- `size` (opcional): Tamaño de página. **Máximo permitido: 50**.
- `search` (opcional): Búsqueda estricta por `nombres`, `apellidos` y `cédula`.
- `activo` (opcional): Filtro por estado del paciente.
- `sort` (opcional): Criterio de ordenamiento. Permitidos: `createdAt`, `nombres`, `apellidos`, `cedula`.
**Request Body:** N/A.
**Response Body (200 OK):** `ApiResponse<PageResponse<PacienteListResponse>>`
**Errores Esperados:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

---

### GET /api/v1/clinica/pacientes/{id}
**Roles Autorizados:** `ADMIN_CLINICA`, `MEDICO`, `RECEPCIONISTA`
**Descripción:** Obtiene los detalles completos de un paciente específico de la clínica.
**Request Body:** N/A.
**Response Body (200 OK):** `ApiResponse<PacienteResponse>`
**Errores Esperados:**
- `401 Unauthorized`, `403 Forbidden`.
- `404 Not Found`: Si el paciente no existe o su ID pertenece a otra clínica.

---

### POST /api/v1/clinica/pacientes
**Roles Autorizados:** `ADMIN_CLINICA`, `MEDICO`, `RECEPCIONISTA`
**Descripción:** Registra un nuevo paciente en la clínica.
**Request Body:**
> **Campos permitidos:** `cedula`, `nombres`, `apellidos`, `fechaNacimiento`, `sexo`, `telefono`, `correo`, `direccion`, `tipoSangre`, `alergias`, `contactoEmergencia`, `telefonoEmergencia`.
> **Campos estrictamente prohibidos en payload:** `clinicaId`, `activo`, `createdAt`, `updatedAt`, historia clínica, citas, facturación, archivos médicos.
**Response Body (201 Created):** `ApiResponse<PacienteResponse>`
**Errores Esperados:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`.

---

### PUT /api/v1/clinica/pacientes/{id}
**Roles Autorizados:** `ADMIN_CLINICA`, `MEDICO`, `RECEPCIONISTA`
**Descripción:** Actualiza los datos demográficos y de contacto del paciente.
**Request Body:**
> Aplican los mismos campos permitidos y estrictamente prohibidos (`clinicaId`, `activo`, etc.) que en POST.
**Response Body (200 OK):** `ApiResponse<PacienteResponse>`
**Errores Esperados:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.

---

### PATCH /api/v1/clinica/pacientes/{id}/estado
**Rol Autorizado:** `ADMIN_CLINICA` (Exclusivo)
**Descripción:** Modifica únicamente el estado de activación del paciente. No modifica ningún otro campo.
**Request Body:**
```json
{
  "activo": true
}
```
**Response Body (200 OK):** `ApiResponse<PacienteResponse>`
**Errores Esperados:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` (Si es Médico o Recepcionista), `404 Not Found`.

---

## Matriz de autorización — Pacientes

| Endpoint | ADMIN_CLINICA | MEDICO | RECEPCIONISTA |
|---|:---:|:---:|:---:|
| `GET /api/v1/clinica/pacientes` (Listar) | ✅ | ✅ | ✅ |
| `GET /api/v1/clinica/pacientes/{id}` (Ver) | ✅ | ✅ | ✅ |
| `POST /api/v1/clinica/pacientes` (Crear) | ✅ | ✅ | ✅ |
| `PUT /api/v1/clinica/pacientes/{id}` (Editar) | ✅ | ✅ | ✅ |
| `PATCH /api/v1/clinica/pacientes/{id}/estado` (Activar/Desactivar) | ✅ | ❌ | ❌ |

> **Reglas Multi-tenant y Aislamiento:**
> - `clinicaId` se obtiene **solo** desde el `TenantContext`.
> - **Ningún payload acepta `clinicaId`.**
> - Toda petición hacia un ID perteneciente a otra clínica responde forzosamente **404 Not Found** previniendo la enumeración de registros foráneos.

---

## Módulo Médicos — `/api/v1/medicos` (BACKEND PARCIAL)

Estado: backend con CRUD básico. Frontend y pruebas E2E pendientes.
---

## Módulo Citas — `/api/v1/clinica/citas`

Gestión de la agenda médica y citas de pacientes.

### GET /api/v1/clinica/citas
**Roles Autorizados:** `ADMIN_CLINICA`, `RECEPCIONISTA`, `MEDICO` (Médico solo visualiza las propias).
**Descripción:** Listado paginado de citas de la clínica.
**Query Params:**
- `page` (opcional): Número de página (base 0).
- `size` (opcional): Tamaño de página. **Máximo 50**, por defecto 10.
- `search` (opcional): Búsqueda textual sobre motivo.
- `pacienteId`, `medicoId` (opcional): Filtros por entidades. `medicoId` hace referencia a la tabla `medicos`.
- `estado` (opcional): Enum de estado.
- `fechaDesde`, `fechaHasta` (opcional): Rango temporal. `fechaDesde` no puede ser posterior a `fechaHasta`. Todas las fechas enviadas/recibidas deben estar en UTC (ISO 8601 con sufijo `Z`, ej. `2026-07-22T14:30:00Z`).
- `sort` (opcional). **Whitelist**: `fechaHoraInicio`, `fechaHoraFin`, `estado`, `createdAt`. *(Nota: `paciente` y `medico` excluidos para evitar consultas join costosas/ambiguas en V1).*
- `direction` (`asc` o `desc`).
**Response Body (200 OK):** `ApiResponse<PageResponse<CitaListResponse>>`

### GET /api/v1/clinica/citas/{id}
**Roles Autorizados:** `ADMIN_CLINICA`, `RECEPCIONISTA`, `MEDICO` (Médico solo puede ver sus propias citas asignadas).
**Descripción:** Detalle completo de una cita.
**Response Body (200 OK):** `ApiResponse<CitaResponse>` (incluye `observaciones`, `motivoCancelacion`).
**Errores Esperados:**
- `404 Not Found`: Si no existe, si pertenece a otra clínica (cross-tenant), o si un MEDICO intenta visualizar una cita asignada a otro colega (ocultación de existencia).

### POST /api/v1/clinica/citas
**Roles Autorizados:** `ADMIN_CLINICA`, `RECEPCIONISTA`
**Descripción:** Programa una nueva cita. El estado inicial será inyectado en backend como `PROGRAMADA`.
**Request Body (`CitaCreateRequest`):**
- **Obligatorios**: `pacienteId`, `medicoId` (ID en la tabla `medicos`, no `usuarios`), `fechaHoraInicio` (`Instant`, UTC ISO 8601 con `Z`), `duracionMinutos`, `motivo`.
- **Opcionales**: `observaciones`.
- **Prohibidos**: `id`, `clinicaId`, `estado`, `fechaHoraFin`, auditoría (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`).
**Errores Esperados:**
- `400 Bad Request`: Validaciones (fechas en el pasado, duracion < 15 o > 480).
- `404 Not Found`: Paciente o Médico no existen en la clínica actual.
- `409 Conflict`: `MEDICO_HORARIO_OCUPADO`, `PACIENTE_HORARIO_OCUPADO`.

### PUT /api/v1/clinica/citas/{id}
**Roles Autorizados:** `ADMIN_CLINICA`, `RECEPCIONISTA`, `MEDICO` (Médico solo editar observaciones en sus citas).
**Descripción:** Reprograma o edita datos de una cita existente.
**Request Body (`CitaUpdateRequest`):**
- Datos administrativos (`pacienteId`, `medicoId`, `fechaHoraInicio`, `duracionMinutos`, `motivo`) solo permitidos si el estado es `PROGRAMADA` o `CONFIRMADA`.
- Las `observaciones` clínicas pueden editarse de forma adicional en el estado `EN_ATENCION` (sujeto a validación de rol: RECEPCIONISTA no puede editar observaciones).
- No se permiten modificaciones (ni administrativas ni clínicas) en estados `COMPLETADA`, `CANCELADA` o `NO_ASISTIO`.
- No se permite editar el `estado` directamente con PUT.
- Si se cambia la fecha u hora de una cita `CONFIRMADA`, su estado **vuelve automáticamente** a `PROGRAMADA`.
**Errores Esperados:**
- `409 Conflict`: Solapamiento de horarios con otra cita. **(Nota: Durante la validación, la consulta debe excluir obligatoriamente la propia cita mediante `citaExistente.id != citaActualId` para evitar colisiones consigo misma. Esto aplica al chequeo por médico y por paciente).**
- `409 Conflict (TRANSICION_ESTADO_INVALIDA)`: Si se intenta editar campos no permitidos para el estado actual.

### PATCH /api/v1/clinica/citas/{id}/estado
**Roles Autorizados:** Depende de la regla de negocio. (MEDICO autorizado para pasar de `PROGRAMADA/CONFIRMADA` a `EN_ATENCION`, de `EN_ATENCION` a `COMPLETADA` y marcar `NO_ASISTIO` en sus propias citas; ADMIN_CLINICA autorizado a casi todo; RECEPCIONISTA excluido de fases clínicas `EN_ATENCION` y `COMPLETADA`).
**Descripción:** Gestiona transiciones de estado de la cita médica.
**Request Body:**
```json
{
  "estado": "CANCELADA",
  "motivoCancelacion": "El paciente llamó para cancelar"
}
```
**Reglas Obligatorias:**
- `motivoCancelacion` es **obligatorio** si el nuevo estado es `CANCELADA`.
- Backend valida estrictamente la matriz de transiciones (e.g. una cita `CANCELADA` es estado final y no puede volver a estar activa).
- `EN_ATENCION` y `NO_ASISTIO` solo pueden aplicarse si la hora actual del backend es >= `fechaHoraInicio`.
- `COMPLETADA` requiere que el estado actual sea `EN_ATENCION`.
- Backend valida estrictamente quién puede hacer qué transición (e.g. Recepcionista no puede pasar a `EN_ATENCION`).
**Errores Esperados:**
- `400 Bad Request`: `MOTIVO_CANCELACION_REQUERIDO`.
- `403 Forbidden`: `TRANSICION_NO_PERMITIDA_PARA_ROL`.
- `409 Conflict`: `TRANSICION_ESTADO_INVALIDA`, `ATENCION_ANTES_DE_HORA`, `NO_ASISTIO_ANTES_DE_HORA`.

---

## Matriz de autorización — Citas

| Endpoint | ADMIN_CLINICA | MEDICO | RECEPCIONISTA |
|---|:---:|:---:|:---:|
| `GET /api/v1/clinica/citas` (Listar) | ✅ | ✅ (Solo propias) | ✅ |
| `GET /api/v1/clinica/citas/{id}` (Ver) | ✅ | ✅ (Solo propias) | ✅ |
| `POST /api/v1/clinica/citas` (Crear) | ✅ | ❌ | ✅ |
| `PUT /api/v1/clinica/citas/{id}` (Editar/Reprogramar) | ✅ (Todo menos info clínica en estado completada) | ✅ (Solo observaciones en propias citas) | ✅ (Todo menos observaciones clínicas) |
| `PATCH /api/v1/clinica/citas/{id}/estado` (Cambiar estado) | ✅ | ✅ (Solo en propias citas) | ✅ (Excepto EN_ATENCION y COMPLETADA) |

> **Reglas Multi-tenant y Aislamiento:**
> - `clinicaId` se obtiene **solo** desde el `TenantContext`.
> - **Ningún payload de Citas acepta `clinicaId`.**
> - Toda petición hacia un ID de cita perteneciente a otra clínica responde forzosamente **404 Not Found**.
