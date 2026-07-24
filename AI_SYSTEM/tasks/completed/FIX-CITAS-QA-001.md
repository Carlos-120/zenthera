# FIX-CITAS-QA-001

Status: COMPLETED
Owner: Builder
Type: Bugfix
Priority: HIGH

## Lecturas Obligatorias
- `AI_SYSTEM/agents/01-builder.md`
- `AI_SYSTEM/tasks/active/FIX-CITAS-QA-001.md`
- `AI_SYSTEM/tasks/active/QA-CITAS-001.md`
- `AI_SYSTEM/tasks/completed/DOC-CITAS-001.md`
- `AI_SYSTEM/tasks/completed/BACK-CITAS-001.md`
- `AI_SYSTEM/tasks/completed/BACK-CITAS-002.md`
- `AI_SYSTEM/tasks/completed/FRONT-CITAS-001.md`
- `AI_SYSTEM/tasks/completed/FRONT-CITAS-002.md`
- `docs/API_CONTRACT.md`
- `AI_SYSTEM/handoffs/current-handoff.md`

## Objetivo

Resolver exclusivamente los tres bloqueantes productivos detectados durante QA-CITAS-001 y verificados en las ejecuciones E2E del 2026-07-22.

No agregar funcionalidad nueva.
No modificar pruebas para ocultar fallos.
No iniciar UI-CITAS-001.
No cerrar QA-CITAS-001 (permanece BLOCKED hasta que esta tarea sea aprobada por Inspector).

## Bloqueante 1 — Paginación

### Síntoma
`getCitas` en `citas.ts` espera `ApiResponse<PageResponse<CitaListResponse>>` y lee `data.data.content`.
La prueba E2E "listado" falla porque la UI queda vacía — el backend devuelve datos que no se mapean.

### Causa probable
`CitaController.listar` devuelve `PageResponse<CitaListResponse>` directamente (sin envolverlo en `ApiResponse`),
mientras que todos los demás endpoints del proyecto retornan `ApiResponse<T>`.

### Acción requerida
Builder debe:
1. Verificar la firma real del endpoint `GET /api/v1/clinica/citas` en producción.
2. Confirmar cuál es el contrato aprobado en `docs/API_CONTRACT.md`.
3. Alinear **un único lado** (backend o frontend) sin duplicar respuestas ni romper el contrato documentado.
4. Actualizar `docs/API_CONTRACT.md` si la corrección modifica el contrato actual.
5. Correr `mvn clean test` para validar que las 62 pruebas existentes siguen en verde.

### Archivos permitidos
- `CitaController.java` (si el fix es backend)
- `src/lib/api/citas.ts` (si el fix es frontend)
- `docs/API_CONTRACT.md` (solo si el contrato cambia)
- Pruebas backend de Citas si hay regresión

---

## Bloqueante 2 — createdAt nulo

### Síntoma
La prueba E2E de "listado" y el panel de detalle muestran `createdAt` vacío o `null`.
`CitaListResponse.createdAt` llega vacío aunque la entidad tiene auditoría.

### Causa probable
`CitaServiceImpl.mapToListResponse` no asigna `createdAt` al DTO,
o la entidad `Cita` no usa la convención de auditoría (`@CreatedDate`, `@EntityListeners`).

### Acción requerida
Builder debe:
1. Confirmar si `Cita` extiende o implementa auditoría (`BaseEntity`, `@EntityListeners`, etc.) igual que `Paciente` y `Usuario`.
2. Verificar que `createdAt` se persiste correctamente al crear una cita.
3. Confirmar que `mapToListResponse` copia el campo al DTO.
4. Nunca ocultar el campo en UI ni eliminarlo del DTO — la solución debe venir de la capa de datos.
5. Correr `mvn clean test` para validar que las 62 pruebas existentes siguen en verde.

### Archivos permitidos
- `Cita.java` (auditoría de entidad)
- `CitaServiceImpl.java` (mapeo)
- `CitaListResponse.java` (si falta el campo)
- `CitaResponse.java` (si falta el campo)
- Pruebas backend de Citas

---

## Bloqueante 3 — Foco del modal de estado

### Síntoma
La prueba E2E de accesibilidad falla en:
```
await expect(page.getByLabel('Nuevo Estado')).toBeFocused();
```
El select del modal no recibe foco inicial al montarse. Además, al recibir un error 409 el modal debería permanecer
abierto y mostrar el error dentro del diálogo.

### Acción requerida
Builder debe corregir en el componente de detalle de cita (`[id]/page.tsx` o modal separado):

1. **Foco inicial**: Al abrir el modal, el `<select id="nuevo-estado">` (o equivalente) debe recibir foco inmediato.
   Usar `useRef` + `useEffect` o `autoFocus` según corresponda.
2. **Escape**: `keydown Escape` debe cerrar el modal y restaurar el foco al activador.
3. **Retorno de foco**: Al cerrar el modal (por Escape o cancelación), el foco vuelve al botón `Cambiar Estado`.
4. **Error interno al PATCH**: Si el PATCH falla (409, 400), el modal permanece abierto y muestra el mensaje de error
   dentro del `role="alert"` dentro del `role="dialog"`.
5. **Limpieza de error**: Al cerrar el modal el error se descarta; al reabrirlo comienza limpio.
6. No modificar `e2e/citas.spec.ts` para ocultar ninguno de estos fallos.

### Archivos permitidos
- `src/app/dashboard/citas/[id]/page.tsx`
- Componente modal si está en archivo separado

---

## Criterios de Aceptación

- [ ] `npm run build` sin errores TypeScript.
- [ ] `mvn clean test` con 62/62 (o más) pruebas en verde.
- [ ] Bloqueante 1 (paginación) resuelto: la UI lista citas reales.
- [ ] Bloqueante 2 (createdAt) resuelto: el campo aparece en listado y detalle.
- [ ] Bloqueante 3 (modal) resuelto: foco, Escape, retorno, error y limpieza funcionan.
- [ ] `e2e/citas.spec.ts` sin modificaciones que enmascaren fallos.
- [ ] Security multi-tenant preservada.
- [ ] Sin regresiones en pruebas globales de backend.

---

## Dependencias y Flujo

```
FIX-CITAS-QA-001 (Builder)
  → Inspector (revisión independiente)
  → QA-CITAS-001 reactivada (Builder: re-ejecutar E2E completo)
  → Inspector (aprobación final QA)
  → UI-CITAS-001 (Aura)
```

---

## Restricciones

- No modificar `e2e/citas.spec.ts`.
- No modificar `playwright.config.ts`.
- No iniciar UI-CITAS-001.
- No agregar dependencias de paquetes sin justificación.
- No alterar módulos de Usuarios, Pacientes ni Clínicas.
- No cambiar RoleGuard ni lógica de autenticación.
- No declarar tarea terminada sin evidencia de build y pruebas.
