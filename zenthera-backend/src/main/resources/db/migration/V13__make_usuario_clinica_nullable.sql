-- V13__make_usuario_clinica_nullable.sql
-- Hacer nullable la columna clinica_id para permitir que SUPER_ADMIN no pertenezca a ninguna clínica
ALTER TABLE usuarios ALTER COLUMN clinica_id DROP NOT NULL;
