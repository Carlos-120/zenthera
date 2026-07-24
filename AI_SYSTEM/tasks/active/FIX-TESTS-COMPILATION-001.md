# FIX-TESTS-COMPILATION-001 — Corregir compilación de pruebas de integración

## Estado

COMPLETED

## Tipo

Corrección crítica de bloqueante

## Objetivo

Corregir los errores de dependencias y de importación (`cannot find symbol`) que impiden compilar las pruebas de integración del backend, permitiendo restablecer la confianza en el código.

## Archivos reportados con fallos

- `src/test/java/com/zenthera/clinica/ClinicaIntegrationTest.java`
- `src/test/java/com/zenthera/security/AuthIntegrationTest.java`
- `src/test/java/com/zenthera/security/SecurityIntegrationTest.java`

## Restricciones

- El backend permanece bloqueado.
- No se puede iniciar el desarrollo del frontend.
- No modificar lógica de negocio de producción; modificar únicamente las pruebas o dependencias necesarias para que éstas compilen.

## Tareas

1. Resolver falta de imports (`ClinicaRepository`, `UsuarioRepository`, `RolRepository`, `JwtService`, etc.).
2. Asegurar que los paquetes (`com.zenthera.enums`, `com.zenthera.dto.common`, `com.zenthera.security.jwt`) referenciados en los tests existan o se actualicen.
3. Ejecutar `.\mvnw.cmd clean test` y verificar compilación exitosa.

## Criterios de aceptación

La tarea solo podrá considerarse exitosa si se presenta evidencia de:
- `BUILD SUCCESS` al ejecutar los tests.
- Las pruebas son verdaderamente ejecutadas.
- Resultados son verificables.
- Revisión posterior independiente (Inspector).
