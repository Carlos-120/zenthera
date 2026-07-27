import { z } from 'zod';
import type { PublicClinicRegistrationRequest } from '@/lib/api/auth';

const requiredText = (message: string) =>
  z.string().trim().min(1, message);

export const PublicClinicRegistrationSchema = z
  .object({
    ruc: requiredText('El RUC es obligatorio'),
    razonSocial: requiredText('La raz\u00f3n social es obligatoria'),
    nombre: requiredText('El nombre de la cl\u00ednica es obligatorio'),
    correo: z
      .string()
      .trim()
      .min(1, 'El correo de la cl\u00ednica es obligatorio')
      .email('Correo de cl\u00ednica inv\u00e1lido'),
    telefono: requiredText('El tel\u00e9fono es obligatorio'),
    adminNombres: requiredText('Los nombres del administrador son obligatorios'),
    adminApellidos: requiredText('Los apellidos del administrador son obligatorios'),
    adminCedula: requiredText('La c\u00e9dula del administrador es obligatoria'),
    adminCorreo: z
      .string()
      .trim()
      .min(1, 'El correo del administrador es obligatorio')
      .email('Correo del administrador inv\u00e1lido'),
    password: z
      .string()
      .min(1, 'La contrase\u00f1a es obligatoria')
      .min(12, 'La contrase\u00f1a debe tener entre 12 y 72 caracteres')
      .max(72, 'La contrase\u00f1a debe tener entre 12 y 72 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la contrase\u00f1a'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrase\u00f1as no coinciden',
    path: ['confirmPassword'],
  });

export type PublicClinicRegistrationFormValues = z.infer<
  typeof PublicClinicRegistrationSchema
>;

export const toPublicClinicRegistrationRequest = (
  data: PublicClinicRegistrationFormValues
): PublicClinicRegistrationRequest => ({
  ruc: data.ruc.trim(),
  razonSocial: data.razonSocial.trim(),
  nombre: data.nombre.trim(),
  correo: data.correo.trim().toLowerCase(),
  telefono: data.telefono.trim(),
  adminNombres: data.adminNombres.trim(),
  adminApellidos: data.adminApellidos.trim(),
  adminCedula: data.adminCedula.trim(),
  adminCorreo: data.adminCorreo.trim().toLowerCase(),
  password: data.password,
});
