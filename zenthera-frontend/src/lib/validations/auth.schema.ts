import { z } from 'zod';
import type { PublicClinicRegistrationRequest } from '@/lib/api/auth';

const requiredText = (message: string) =>
  z.string().trim().min(1, message);

export const PublicClinicRegistrationSchema = z
  .object({
    nombre: requiredText('El nombre de la cl\u00ednica es obligatorio'),
    adminNombres: requiredText('Los nombres del administrador son obligatorios'),
    adminApellidos: requiredText('Los apellidos del administrador son obligatorios'),
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
    terminosAceptados: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones',
    }),
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
  nombre: data.nombre.trim(),
  adminNombres: data.adminNombres.trim(),
  adminApellidos: data.adminApellidos.trim(),
  adminCorreo: data.adminCorreo.trim().toLowerCase(),
  password: data.password,
  terminosAceptados: data.terminosAceptados,
});
