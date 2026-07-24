-- V5__update_clinicas_and_audit.sql
-- 1. Añadir columnas de información a clinicas
ALTER TABLE clinicas
    ADD COLUMN razon_social VARCHAR(150),
    ADD COLUMN zona_horaria VARCHAR(50);

-- 2. Backfill: Rellenar razon_social y zona_horaria para clínicas existentes
UPDATE clinicas
SET
    razon_social = nombre,
    zona_horaria = 'America/Guayaquil'
WHERE razon_social IS NULL OR zona_horaria IS NULL;

-- 3. Hacer razon_social y zona_horaria NOT NULL después del backfill
ALTER TABLE clinicas
    ALTER COLUMN razon_social SET NOT NULL,
    ALTER COLUMN zona_horaria SET NOT NULL;

-- 4. Crear tabla de auditoría para cambios de estado en clínicas
CREATE TABLE auditoria_estado_clinicas (
    id BIGSERIAL PRIMARY KEY,
    clinica_id BIGINT NOT NULL,
    estado_anterior BOOLEAN NOT NULL,
    estado_nuevo BOOLEAN NOT NULL,
    motivo TEXT NOT NULL,
    usuario_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_auditoria_estado_cambio CHECK (estado_anterior <> estado_nuevo),
    CONSTRAINT chk_auditoria_motivo_no_vacio CHECK (BTRIM(motivo) <> '')
);

-- 5. Crear índices requeridos para la tabla de auditoría
CREATE INDEX idx_auditoria_clinica_id ON auditoria_estado_clinicas(clinica_id);
CREATE INDEX idx_auditoria_usuario_id ON auditoria_estado_clinicas(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_estado_clinicas(created_at);
