-- V11__make_public_registration_fields_nullable.sql
-- Hacer nullable los campos operativos que serán solicitados en el onboarding
ALTER TABLE clinicas ALTER COLUMN razon_social DROP NOT NULL;
ALTER TABLE usuarios ALTER COLUMN cedula DROP NOT NULL;
