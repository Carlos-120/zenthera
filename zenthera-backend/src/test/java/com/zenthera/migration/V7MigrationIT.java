package com.zenthera.migration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfoService;
import org.flywaydb.core.api.MigrationState;
import org.flywaydb.core.api.output.MigrateResult;
import org.flywaydb.core.api.output.ValidateResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.flywaydb.core.api.FlywayException;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers // Sin disableWithoutDocker para que el gate de CI falle si falta Docker
public class V7MigrationIT {

    @Container
    private PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17")
            .withDatabaseName("zenthera_test")
            .withUsername("testuser")
            .withPassword("testpass");

    private Connection connection;

    @BeforeEach
    void setUp() throws Exception {
        connection = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }

    @AfterEach
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    private String getScratchDir() {
        return Paths.get(System.getProperty("user.dir")).getParent().resolve("scratch").toAbsolutePath().toString();
    }

    private void insertLegacyTestData(boolean withMotivoEstado) throws Exception {
        String legacySql = new String(Files.readAllBytes(Paths.get(getScratchDir(), "fixtures", "legacy_v6_schema.sql")));
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(legacySql);

            // Clinica
            String motivo = withMotivoEstado ? "'Bloqueada temporalmente'" : "NULL";
            stmt.execute("INSERT INTO clinicas (nombre, razon_social, activa, created_at, ruc, zona_horaria, motivo_estado) " +
                    "VALUES ('Clinica Test', 'Razon Test', true, now(), '1234567890001', NULL, " + motivo + ")");
            // Rol
            stmt.execute("INSERT INTO roles (nombre, created_at) VALUES ('ADMIN_CLINICA', now())");
            // Usuario
            stmt.execute("INSERT INTO usuarios (nombres, apellidos, cedula, correo, password, activo, bloqueado, cambiar_password, clinica_id, rol_id, created_at) " +
                    "VALUES ('Juan', 'Perez', '1234567890', 'juan@test.com', 'pass', true, false, false, 1, 1, now())");
        }
    }

    @Test
    void testNewInstallation_B6_to_V7() throws Exception {
        Flyway flyway = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("filesystem:" + getScratchDir() + "/migrations")
                .load();

        MigrateResult result = flyway.migrate();
        assertTrue(result.success);

        ValidateResult validateResult = flyway.validateWithResult();
        assertTrue(validateResult.validationSuccessful);

        MigrationInfoService info = flyway.info();

        boolean hasB6 = Arrays.stream(info.all()).anyMatch(m -> m.getVersion().toString().equals("6") && (m.getState() == MigrationState.SUCCESS || m.getState() == MigrationState.BASELINE));
        boolean hasV7 = Arrays.stream(info.all()).anyMatch(m -> m.getVersion().toString().equals("7") && m.getState() == MigrationState.SUCCESS);
        assertTrue(hasB6, "Debe tener registro de versión 6");
        assertTrue(hasV7, "Debe tener registro de versión 7 exitosa");

        // Validar constraints canónicas
        assertTrue(checkConstraintExists("uk_usuario_correo"));
        assertTrue(checkConstraintExists("uk_usuario_cedula"));
        assertTrue(checkConstraintExists("uk_clinica_ruc"));
        assertTrue(checkConstraintExists("uk_rol_nombre"));
        assertTrue(checkConstraintExists("fk_usuario_clinica"));
        assertTrue(checkConstraintExists("fk_usuario_rol"));

        // Validar checks y que estén validados (convalidated = true)
        assertTrue(checkConstraintExistsAndValidated("chk_auditoria_estado_cambio"));
        assertTrue(checkConstraintExistsAndValidated("chk_auditoria_motivo_no_vacio"));

        // Validar zona_horaria NOT NULL y default
        try (Statement stmt = connection.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT is_nullable, column_default FROM information_schema.columns WHERE table_name = 'clinicas' AND column_name = 'zona_horaria'");
            assertTrue(rs.next());
            assertEquals("NO", rs.getString("is_nullable"));
            assertEquals("'America/Guayaquil'::character varying", rs.getString("column_default"));

            // Validar ausencia de motivo_estado
            ResultSet rs2 = stmt.executeQuery("SELECT 1 FROM information_schema.columns WHERE table_name = 'clinicas' AND column_name = 'motivo_estado'");
            assertFalse(rs2.next(), "La columna motivo_estado no debe existir.");
        }

        // Validar tablas esperadas
        List<String> expectedTables = Arrays.asList("clinicas", "roles", "usuarios", "pacientes", "medicos", "refresh_tokens", "auditoria_estado_clinicas", "activation_tokens");
        for (String table : expectedTables) {
            assertTrue(checkTableExists(table), "La tabla " + table + " debe existir.");
        }
    }

    @Test
    void testLegacyInstallation_V6_to_V7_Success() throws Exception {
        insertLegacyTestData(false);

        Flyway flyway = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("filesystem:" + getScratchDir() + "/migrations")
                .baselineVersion("6")
                .load();

        flyway.baseline();
        MigrateResult result = flyway.migrate();
        assertTrue(result.success);

        ValidateResult validateResult = flyway.validateWithResult();
        assertTrue(validateResult.validationSuccessful);

        MigrationInfoService info = flyway.info();
        boolean hasV6Baseline = Arrays.stream(info.all()).anyMatch(m -> m.getVersion().toString().equals("6") && m.getState() == MigrationState.BASELINE);
        boolean hasV7Success = Arrays.stream(info.all()).anyMatch(m -> m.getVersion().toString().equals("7") && m.getState() == MigrationState.SUCCESS);
        assertTrue(hasV6Baseline);
        assertTrue(hasV7Success);

        // Constraints legacy (hashes) deben desaparecer explícitamente
        assertFalse(checkConstraintExists("ukcdmw5hxlfj78uf4997i3qyyw5"));
        assertFalse(checkConstraintExists("ukefovjjo5q5jlsa0f9eoptdjly"));
        assertFalse(checkConstraintExists("ukldv0v52e0udsh2h1rs0r0gw1n"));
        assertFalse(checkConstraintExists("ukp4ikh0cjnhgbvk5lmq61gch11"));
        assertFalse(checkConstraintExists("fknd12oq18m4e8stc8nkckhrxog"));
        assertFalse(checkConstraintExists("fkqf5elo4jcq7qrt83oi0qmenjo"));

        // Constraints canónicas deben existir
        assertTrue(checkConstraintExists("uk_usuario_correo"));
        assertTrue(checkConstraintExists("uk_usuario_cedula"));
        assertTrue(checkConstraintExists("uk_clinica_ruc"));
        assertTrue(checkConstraintExists("uk_rol_nombre"));
        assertTrue(checkConstraintExists("fk_usuario_clinica"));
        assertTrue(checkConstraintExists("fk_usuario_rol"));

        // Checks deben estar validados
        assertTrue(checkConstraintExistsAndValidated("chk_auditoria_estado_cambio"));
        assertTrue(checkConstraintExistsAndValidated("chk_auditoria_motivo_no_vacio"));

        // Persistencia y drift
        try (Statement stmt = connection.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT nombre, ruc, zona_horaria FROM clinicas WHERE id = 1");
            assertTrue(rs.next());
            assertEquals("America/Guayaquil", rs.getString("zona_horaria"));
            assertEquals("Clinica Test", rs.getString("nombre"));
            assertEquals("1234567890001", rs.getString("ruc"));

            ResultSet rs2 = stmt.executeQuery("SELECT 1 FROM information_schema.columns WHERE table_name = 'clinicas' AND column_name = 'motivo_estado'");
            assertFalse(rs2.next());

            ResultSet rs3 = stmt.executeQuery("SELECT nombres, correo FROM usuarios WHERE id = 1");
            assertTrue(rs3.next());
            assertEquals("Juan", rs3.getString("nombres"));
            assertEquals("juan@test.com", rs3.getString("correo"));

            ResultSet rs4 = stmt.executeQuery("SELECT nombre FROM roles WHERE id = 1");
            assertTrue(rs4.next());
            assertEquals("ADMIN_CLINICA", rs4.getString("nombre"));
        }
    }

    @Test
    void testLegacyInstallation_V6_to_V7_BlockedByMotivoEstado() throws Exception {
        insertLegacyTestData(true); // CON motivo_estado='Test'

        Flyway flyway = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("filesystem:" + getScratchDir() + "/migrations")
                .baselineVersion("6")
                .load();

        flyway.baseline();

        assertThrows(FlywayException.class, flyway::migrate, "Debe fallar porque motivo_estado contiene datos");

        // Confirmar rollback completo
        try (Statement stmt = connection.createStatement()) {
            // Columna todavía existe y preserva el dato
            ResultSet rs2 = stmt.executeQuery("SELECT motivo_estado FROM clinicas WHERE id = 1");
            assertTrue(rs2.next());
            assertEquals("Bloqueada temporalmente", rs2.getString("motivo_estado"));

            // Renombrado no se realizó (hashes persisten)
            assertFalse(checkConstraintExists("uk_usuario_correo"), "No debió crearse uk_usuario_correo");
            assertTrue(checkConstraintByColumn("usuarios", "correo", "u"), "Debe preservar la constraint original");
        }
    }

    @Test
    void testLegacyInstallation_MissingConstraint() throws Exception {
        insertLegacyTestData(false);
        try (Statement stmt = connection.createStatement()) {
            // Eliminar hash constraint original de correo para simular falta de constraint
            stmt.execute("ALTER TABLE usuarios DROP CONSTRAINT ukcdmw5hxlfj78uf4997i3qyyw5");
        }

        Flyway flyway = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("filesystem:" + getScratchDir() + "/migrations")
                .baselineVersion("6")
                .load();

        flyway.baseline();
        assertThrows(FlywayException.class, flyway::migrate, "Debe fallar si no encuentra la constraint original");
    }

    @Test
    void testLegacyInstallation_DuplicateConstraint() throws Exception {
        insertLegacyTestData(false);
        try (Statement stmt = connection.createStatement()) {
            // Agregar una duplicada sobre correo para causar falla por tener 2 constraints de correo
            stmt.execute("ALTER TABLE usuarios ADD CONSTRAINT uk_duplicada_correo UNIQUE (correo)");
        }

        Flyway flyway = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("filesystem:" + getScratchDir() + "/migrations")
                .baselineVersion("6")
                .load();

        flyway.baseline();
        assertThrows(FlywayException.class, flyway::migrate, "Debe fallar al encontrar más de una coincidencia");
    }

    @Test
    void testLegacyInstallation_TargetNameOccupied() throws Exception {
        insertLegacyTestData(false);
        try (Statement stmt = connection.createStatement()) {
            // Crear una constraint random con el nombre que buscamos en OTRA tabla para ocupar el nombre
            stmt.execute("ALTER TABLE roles ADD CONSTRAINT uk_usuario_correo UNIQUE (descripcion)");
        }

        Flyway flyway = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("filesystem:" + getScratchDir() + "/migrations")
                .baselineVersion("6")
                .load();

        flyway.baseline();
        assertThrows(FlywayException.class, flyway::migrate, "Debe fallar porque uk_usuario_correo ya está ocupado");
    }

    @Test
    void testStructuralComparison_B6_vs_LegacyV7() throws Exception {
        // Ejecutar Legacy V7
        insertLegacyTestData(false);
        Flyway flywayLegacy = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("filesystem:" + getScratchDir() + "/migrations")
                .baselineVersion("6")
                .load();
        flywayLegacy.baseline();
        flywayLegacy.migrate();

        List<String> legacyColumns = getOrderedColumnDefinitions();
        List<String> legacyConstraints = getOrderedConstraintDefinitions();
        List<String> legacyIndices = getOrderedIndexDefinitions();
        List<String> legacySequences = getOrderedSequenceDefinitions();

        // Limpiar DB manualmente
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;");
        }

        // Ejecutar B6+V7
        Flyway flywayNew = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("filesystem:" + getScratchDir() + "/migrations")
                .load();
        flywayNew.migrate();

        List<String> newColumns = getOrderedColumnDefinitions();
        List<String> newConstraints = getOrderedConstraintDefinitions();
        List<String> newIndices = getOrderedIndexDefinitions();
        List<String> newSequences = getOrderedSequenceDefinitions();

        assertFalse(legacyColumns.isEmpty());
        assertFalse(legacyConstraints.isEmpty());

        // Filtramos flyway_schema_history porque difiere
        legacyColumns.removeIf(col -> col.startsWith("flyway_schema_history"));
        newColumns.removeIf(col -> col.startsWith("flyway_schema_history"));
        legacyConstraints.removeIf(con -> con.startsWith("flyway_schema_history"));
        newConstraints.removeIf(con -> con.startsWith("flyway_schema_history"));
        legacyIndices.removeIf(idx -> idx.contains("flyway_schema_history"));
        newIndices.removeIf(idx -> idx.contains("flyway_schema_history"));

        assertEquals(newColumns, legacyColumns, "Las columnas deben ser estructuralmente idénticas");
        assertEquals(newConstraints, legacyConstraints, "Las constraints deben ser estructuralmente idénticas");
        assertEquals(newIndices, legacyIndices, "Los índices deben ser estructuralmente idénticos");
        assertEquals(newSequences, legacySequences, "Las secuencias deben ser estructuralmente idénticas");
    }

    private boolean checkConstraintExists(String constraintName) throws Exception {
        String sql = "SELECT 1 FROM pg_constraint WHERE conname = ? AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, constraintName);
            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    private boolean checkConstraintExistsAndValidated(String constraintName) throws Exception {
        String sql = "SELECT convalidated FROM pg_constraint WHERE conname = ? AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, constraintName);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getBoolean("convalidated");
                }
                return false;
            }
        }
    }

    private boolean checkConstraintByColumn(String tableName, String columnName, String type) throws Exception {
        String sql = "SELECT 1 FROM pg_constraint con " +
                     "JOIN pg_class rel ON rel.oid = con.conrelid " +
                     "JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace " +
                     "JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1] " +
                     "WHERE rel.relname = ? AND nsp.nspname = 'public' AND con.contype = ?::\"char\" AND att.attname = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, tableName);
            pstmt.setString(2, type);
            pstmt.setString(3, columnName);
            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    private boolean checkTableExists(String tableName) throws Exception {
        String sql = "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, tableName);
            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    private List<String> getOrderedColumnDefinitions() throws Exception {
        List<String> list = new ArrayList<>();
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, column_name")) {
            while (rs.next()) {
                list.add(String.format("%s.%s %s %s %s", rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5)));
            }
        }
        Collections.sort(list);
        return list;
    }

    private List<String> getOrderedConstraintDefinitions() throws Exception {
        List<String> list = new ArrayList<>();
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT rel.relname, con.conname, con.contype, pg_get_constraintdef(con.oid), con.convalidated FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace WHERE nsp.nspname = 'public' ORDER BY rel.relname, con.conname")) {
            while (rs.next()) {
                list.add(String.format("%s %s %s %s %s", rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getBoolean(5)));
            }
        }
        Collections.sort(list);
        return list;
    }

    private List<String> getOrderedIndexDefinitions() throws Exception {
        List<String> list = new ArrayList<>();
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname")) {
            while (rs.next()) {
                // Excluimos los índices de las primary keys y unique constraints generadas por las secuencias / constraints porque ya las validamos
                // pero estructuralmente pg_indexes incluye todo, lo mantenemos y solo quitamos flyway
                list.add(String.format("%s %s %s", rs.getString(1), rs.getString(2), rs.getString(3)));
            }
        }
        Collections.sort(list);
        return list;
    }

    private List<String> getOrderedSequenceDefinitions() throws Exception {
        List<String> list = new ArrayList<>();
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' ORDER BY sequence_name")) {
            while (rs.next()) {
                list.add(String.format("%s", rs.getString(1)));
            }
        }
        Collections.sort(list);
        return list;
    }
}
