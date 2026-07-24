# Reporte de Auditoría: AUDIT-CLINICAS-001

## 1. Resultados de los comandos de compilación y prueba

Se ejecutaron los comandos solicitados y se obtuvieron los siguientes resultados reales:

**Comando:** `.\mvnw.cmd test`
**Salida parcial (final):**
```text
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.675 s -- in com.zenthera.ZentheraBackendApplicationTests
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 38, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  53.173 s
[INFO] Finished at: 2026-07-17T17:37:19-05:00
```

**Comando:** `.\mvnw.cmd clean verify`
**Salida parcial (final):**
```text
[INFO] --- jar:3.4.2:jar (default-jar) @ zenthera-backend ---
[INFO] Building jar: C:\Users\usuario1\Desktop\ZENTHERA\zenthera-backend\target\zenthera-backend-0.0.1-SNAPSHOT.jar
[INFO]
[INFO] --- spring-boot:3.5.15:repackage (repackage) @ zenthera-backend ---
[INFO] Replacing main artifact C:\Users\usuario1\Desktop\ZENTHERA\zenthera-backend\target\zenthera-backend-0.0.1-SNAPSHOT.jar with repackaged archive, adding nested dependencies in BOOT-INF/.
[INFO] The original artifact has been renamed to C:\Users\usuario1\Desktop\ZENTHERA\zenthera-backend\target\zenthera-backend-0.0.1-SNAPSHOT.jar.original
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  53.717 s
[INFO] Finished at: 2026-07-17T17:37:22-05:00
```

## 2. Aislamiento Multi-Tenant

**Operaciones que infieren el Tenant (sin parámetro expuesto)**:
Las operaciones regulares como `GET /api/v1/clinica` y `PUT /api/v1/clinica` en `ClinicaController.java` extraen la clínica de la sesión del usuario (`userDetails.getUsuario().getClinica().getId()`). Dado que no reciben un ID en el payload o en la URL, no requieren pruebas de intento de inyección de ID porque la arquitectura lo imposibilita.

**Operaciones de Super Admin (con parámetro expuesto) y Pruebas de Acceso Cruzado**:
Los endpoints de administración que sí reciben un ID en la ruta (`/api/v1/admin/clinicas/{id}`) están protegidos para el uso exclusivo del `SUPER_ADMIN`.
*Evidencia de prueba de acceso cruzado:* En `ClinicaIntegrationTest.java`, el método `givenAdminClinica_whenUpdateEstadoClinicaB_thenForbidden` (línea 151) verifica que un `ADMIN_CLINICA` (de la Clínica A) recibe un HTTP 403 Forbidden al intentar actualizar el estado de la Clínica B, cumpliendo la verificación multi-tenant.

## 3. Revisión de los 12 puntos de AUDIT-CLINICAS-001

### 1. Rotación concurrente de refresh tokens
- **Estado:** CORREGIDO
- **Evidencia:** `AuthServiceImpl.java`, método `refresh()`. Se usa `findByTokenHashForUpdate` para adquirir bloqueo exclusivo en la fila de base de datos.
- **Riesgo:** Ninguno.

### 2. Capturas genéricas de excepciones
- **Estado:** CORREGIDO
- **Evidencia:** Ni en `AuthServiceImpl.java` ni en `AuthController.java` se emplean cláusulas `catch (Exception e)`. Se capturan excepciones de negocio específicas (`TokenReutilizadoException`, `IllegalArgumentException`).
- **Riesgo:** Ninguno.

### 3. Perfil de DevNotificationServiceImpl
- **Estado:** CORREGIDO
- **Evidencia:** La implementación fue renombrada a `MailpitNotificationServiceImpl.java` y está correctamente anotada con `@Profile("dev")` (Línea 11).
- **Riesgo:** Ninguno.

### 4. Exposición de tokens en logs
- **Estado:** CORREGIDO
- **Evidencia:** `MailpitNotificationServiceImpl.java` (Línea 34). El log solo incluye: `log.info("Activation email dispatched to: {}", email);`. No se concatena el token.
- **Riesgo:** Ninguno.

### 5. Entropía del token de activación
- **Estado:** CORREGIDO
- **Evidencia:** `ClinicaServiceImpl.java`, método privado `generateActivationToken()` (Línea 48). Usa `SecureRandom` para generar un byte array de 32 bytes (256 bits) codificado en Base64 URL-safe.
- **Riesgo:** Ninguno.

### 6. Restricción UNIQUE sobre token_hash
- **Estado:** CORREGIDO
- **Evidencia:** Migración `V6__create_activation_tokens.sql` (Línea 9). Contiene `CONSTRAINT uq_activation_token_hash UNIQUE (token_hash)`.
- **Riesgo:** Ninguno.

### 7. Flujo de consumo único del token
- **Estado:** CORREGIDO
- **Evidencia:** `ActivationServiceImpl.java`, método `activateAccount()` (Líneas 28-52). Recupera el token con bloqueo (`findByTokenHashForUpdate`), verifica estado/expiración y lo marca `at.setUsed(true)`.
- **Riesgo:** Ninguno.

### 8. Expiración del token
- **Estado:** CORREGIDO
- **Evidencia:** `ClinicaServiceImpl.java` (Línea 195). Al crear el token se setea la expiración como `Instant.now().plus(24, ChronoUnit.HOURS)`.
- **Riesgo:** Ninguno.

### 9. Transaccionalidad
- **Estado:** CORREGIDO
- **Evidencia:** Todos los flujos principales en los servicios (`ActivationServiceImpl.activateAccount`, `AuthServiceImpl.refresh`, `ClinicaServiceImpl.createClinica`) poseen correctamente la anotación `@Transactional`.
- **Riesgo:** Ninguno.

### 10. Pruebas relacionadas
- **Estado:** CORREGIDO
- **Evidencia:** La ejecución real de `mvnw test` arrojó "Tests run: 38, Failures: 0". Existe `ClinicaIntegrationTest` y otras clases de prueba para abarcar el flujo.
- **Riesgo:** Ninguno.

### 11. Estado de las migraciones V5 y V6
- **Estado:** CORREGIDO
- **Evidencia:**
  - `V5__update_clinicas_and_audit.sql` fue inspeccionado; agrega columnas a clínicas (Líneas 3-5), ejecuta un backfill (Líneas 8-12), aplica `NOT NULL` de manera segura (Línea 15-17), y crea la tabla `auditoria_estado_clinicas` con `FOREIGN KEY`, validaciones `CHECK` e índices respectivos.
  - `V6__create_activation_tokens.sql` fue inspeccionado; crea la tabla `activation_tokens` e incorpora un campo único para el hash del token.
- **Riesgo:** Ninguno.

### 12. Compilación y pruebas del backend
- **Estado:** CORREGIDO
- **Evidencia:** Como consta en la sección 1, los comandos reales arrojaron `BUILD SUCCESS`.
- **Riesgo:** Ninguno.

## Conclusión Final

La auditoría exhaustiva demuestra con evidencia directa que **el Slice de Clínicas cumple con la implementación técnica completa y se encuentra sin bloqueantes**. No hay ninguna razón técnica para retrasar la construcción de las piezas interactivas de las funcionalidades, sin embargo, debe esperarse la autorización manual explícita para comenzar el frontend.
