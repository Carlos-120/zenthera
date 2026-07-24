# DOC-CITAS-001

Status: COMPLETED
Owner: Builder
Type: Architecture / Documentation
Priority: High

## Objetivo
Definición funcional, modelo de base de datos, estados, matriz de permisos, reglas de negocio y contrato API para el módulo de Citas.

## 1. Modelo Funcional (Entidad Cita)
Campos de la entidad:
- **id**: (PK) UUID o numérico auto-incremental.
- **clinicaId**: (FK interno) Long. Obligatorio. Nunca expuesto ni recibido del cliente.
- **pacienteId**: (FK) Long. Obligatorio. Relación con Paciente.
- **medicoId**: (FK) Long. Obligatorio. Relación con Medico (citas.medico_id -> medicos.id). Medico es una entidad clínica separada. No confundir usuarioId con medicoId.
- **fechaHoraInicio**: Instant. Obligatorio.
- **fechaHoraFin**: Instant. Obligatorio. Calculada en el backend.
- **duracionMinutos**: Integer. Obligatorio. Rango: 15 a 480 minutos.
- **estado**: Enum. Obligatorio. Por defecto: PROGRAMADA.
- **motivo**: String. Obligatorio. Longitud máxima: 255 caracteres.
- **observaciones**: String. Opcional. Longitud máxima: 1000 caracteres.
- **motivoCancelacion**: String. Opcional/Obligatorio si estado es CANCELADA. Longitud máxima: 500 caracteres.
- **createdAt**, **updatedAt**, **createdBy**, **updatedBy**: Auditoría estándar. Manejo interno.

*Restricciones*: No se duplicará la información completa de Paciente o Médico, solo se conservan sus IDs como Foreign Keys reales. La autorización del usuario autenticado con rol MEDICO se resuelve contra su registro asociado en la tabla medicos.

## 2. Estados y Transiciones
Estados: PROGRAMADA, CONFIRMADA, EN_ATENCION, COMPLETADA, CANCELADA, NO_ASISTIO.

Matriz de transiciones:
- **PROGRAMADA**: puede pasar a -> CONFIRMADA, EN_ATENCION, CANCELADA, NO_ASISTIO. (Paso directo a EN_ATENCION permitido si hora actual >= fechaHoraInicio).
- **CONFIRMADA**: puede pasar a -> EN_ATENCION, CANCELADA, NO_ASISTIO.
- **EN_ATENCION**: puede pasar a -> COMPLETADA.
- **COMPLETADA**: estado final. No se puede editar información clínica.
- **CANCELADA**: estado final. No se puede recuperar ni editar. (Debe crearse una nueva cita para recuperarla).
- **NO_ASISTIO**: estado final.

Restricciones temporales de estado:
- **EN_ATENCION**: Requiere que la hora actual del backend sea >= fechaHoraInicio (sin tolerancia). De lo contrario: ATENCION_ANTES_DE_HORA (409 Conflict).
- **NO_ASISTIO**: Requiere que la hora actual del backend sea >= fechaHoraInicio. De lo contrario: NO_ASISTIO_ANTES_DE_HORA (409 Conflict). Solo puede aplicarse desde PROGRAMADA o CONFIRMADA.

## 3. Reglas de Edición y Reprogramación
**Datos administrativos y de agenda** (pacienteId, medicoId, echaHoraInicio, duracionMinutos, motivo):
- Solo pueden modificarse en estado PROGRAMADA o CONFIRMADA.
- La echaHoraFin es recalculada.
- Al reprogramar (cambio de fecha/hora) una cita CONFIRMADA, vuelve automáticamente a PROGRAMADA.
- La nueva fecha debe ser en el futuro y revalidar disponibilidad/cruces.

**Observaciones clínicas** (observaciones):
- Pueden modificarse en PROGRAMADA, CONFIRMADA y EN_ATENCION.
- NO pueden modificarse después de alcanzar un estado final (COMPLETADA, CANCELADA, NO_ASISTIO).

Restricciones por rol en Observaciones:
- RECEPCIONISTA: No puede editar observaciones clínicas.
- MEDICO: Puede editar observaciones únicamente en sus propias citas.
- ADMIN_CLINICA: Puede editar según la política definida, pero no después de COMPLETADA.

## 4. Reglas Temporales (UTC)
- Persistencia y lógica backend: Instant (UTC).
- API (DTOs): ISO 8601 UTC con sufijo Z (ej. 2026-07-22T14:30:00Z).
- El cliente envía y recibe fechas en UTC. El frontend convierte a la zona horaria de la clínica solo para visualización.
- El backend NO confía en la hora local del navegador. Comparaciones y cruces se realizan enteramente en UTC.
- **Duración**: Mínimo 15 min, Máximo 480 min.
- **fechaHoraFin**: Calculada estrictamente por el backend (fechaHoraInicio + duracionMinutos).
- **Fecha válida**: fechaHoraInicio debe ser mayor a la hora actual.

## 5. Prevención de Cruces (Solapamiento)
Fórmula de condición:
`nuevoInicio < citaExistenteFin AND nuevoFin > citaExistenteInicio`

Reglas de exclusión:
- En creación, se comparan todas las citas relevantes del mismo tenant.
- En actualización o reprogramación, la consulta debe excluir la cita actual mediante la condición `citaExistente.id != citaActualId`.
- La exclusión de la propia cita aplica tanto al chequeo por médico como al chequeo por paciente, para evitar que la cita colisione consigo misma.
- Se ignoran EXCLUSIVAMENTE las citas con estado **CANCELADA** (porque este estado libera explícitamente el horario).
- Estados COMPLETADA y NO_ASISTIO conservan su intervalo histórico y no deben eliminarse del cálculo por estado arbitrariamente (si se evalúa una fecha histórica o edición excepcional, la fórmula temporal sigue siendo la fuente de verdad).

Se verifican conflictos independientemente para el mismo médico o el mismo paciente dentro del mismo tenant.
Respuesta: HTTP 409 Conflict (`MEDICO_HORARIO_OCUPADO`, `PACIENTE_HORARIO_OCUPADO`).

## 6. Roles y Permisos (Matriz de Citas)
- **ADMIN_CLINICA**: Todas las citas de la clínica. Puede listar, ver, crear, editar, reprogramar, confirmar, cancelar y marcar NO_ASISTIO.
- **RECEPCIONISTA**: Igual que admin en CRUD, pero NO puede editar observaciones, ni iniciar (EN_ATENCION) ni finalizar (COMPLETADA) atención clínica.
- **MEDICO**:
  - Listar y ver ÚNICAMENTE sus propias citas.
  - Editar observaciones ÚNICAMENTE en sus citas (si el estado lo permite).
  - Pasar a EN_ATENCION y a COMPLETADA.
  - Marcar NO_ASISTIO (solo en sus propias citas).
  - No puede crear, reprogramar ni cancelar.
- **SUPER_ADMIN**: Sin acceso.

## 7. Validaciones de Relaciones (Multi-tenant)
- **Paciente**: Debe existir, activo y pertenecer al tenant del JWT.
- **Médico**: Debe existir en la tabla medicos (entidad separada), estar activo, y pertenecer al tenant del JWT.

## 8. Contrato API y Respuestas
Definido en docs/API_CONTRACT.md.
Whitelist de ordenamiento en listado: fechaHoraInicio, fechaHoraFin, estado, createdAt.
*Nota sobre listado:* Ordenar por paciente o medico excluido para evitar N+1/join costosos en V1. Los DTOs usan medicoId (tabla medicos), y fechas en UTC (Z).

## 9. Errores y Códigos de Negocio
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found (cross-tenant, o médico viendo cita de otro).
- 409 Conflict:
  - TRANSICION_ESTADO_INVALIDA
  - MEDICO_HORARIO_OCUPADO
  - PACIENTE_HORARIO_OCUPADO
  - NO_ASISTIO_ANTES_DE_HORA
  - ATENCION_ANTES_DE_HORA
- Otros: CITA_NO_ENCONTRADA, MEDICO_INACTIVO, PACIENTE_INACTIVO, FECHA_CITA_INVALIDA, DURACION_CITA_INVALIDA, MOTIVO_CANCELACION_REQUERIDO.

## 10. Persistencia Propuesta (DB)
Tabla: citas
- claves; FK pacientes, FK medicos, FK clinicas.
- relaciones;
- índices por clinica_id.
- índices compuestos por clinica_id, medico_id, fecha_hora_inicio, fecha_hora_fin.
- índices compuestos por clinica_id, paciente_id, fecha_hora_inicio, fecha_hora_fin.
- índices de estados: clinica_id, estado, fecha_hora_inicio.
- estado como VARCHAR.

## 11. Criterios de Aceptación
- [ ] Entidad Cita estructurada con restricciones y control cross-tenant. FK a medicos (no usuarios).
- [ ] Máquina de estados estricta documentada (ATENCION_ANTES_DE_HORA, NO_ASISTIO_ANTES_DE_HORA).
- [ ] Endpoints definidos en API_CONTRACT (UTC Z, Instant).
- [ ] Lógica de validación temporal y cruces ignorando solo CANCELADA.
- [ ] Diferenciación de edición de observaciones (permitido EN_ATENCION) vs agenda (bloqueado).
- [ ] DTOs y Request Bodies definidos descartando variables controladas en backend.
