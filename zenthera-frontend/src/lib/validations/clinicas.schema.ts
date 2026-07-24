import { z } from 'zod';

export const ClinicaCreateSchema = z.object({
  ruc: z.string().min(1, 'El RUC es obligatorio'),
  razonSocial: z.string().min(1, 'La razón social es obligatoria'),
  nombre: z.string().min(1, 'El nombre comercial es obligatorio'),
  correo: z.string().email('Correo inválido').min(1, 'El correo administrativo es obligatorio'),
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  adminNombres: z.string().min(1, 'Los nombres del administrador son obligatorios'),
  adminApellidos: z.string().min(1, 'Los apellidos del administrador son obligatorios'),
  adminCedula: z.string().min(1, 'La cédula del administrador es obligatoria'),
  adminCorreo: z.string().email('Correo inválido').min(1, 'El correo del administrador es obligatorio'),
});

export type ClinicaCreateInput = z.infer<typeof ClinicaCreateSchema>;

export const ClinicaUpdateSchema = z.object({
  nombre: z.string().min(1, 'El nombre comercial no puede estar vacío'),
  logo: z.string().optional().or(z.literal('')),
  telefono: z.string().min(1, 'El teléfono no puede estar vacío'),
  correo: z.string().email('Correo inválido').min(1, 'El correo no puede estar vacío'),
  direccion: z.string().min(1, 'La dirección no puede estar vacía'),
  ciudad: z.string().optional().or(z.literal('')),
  provincia: z.string().optional().or(z.literal('')),
  pais: z.string().optional().or(z.literal('')),
  zonaHoraria: z.string().min(1, 'La zona horaria no puede estar vacía'),
});

export type ClinicaUpdateInput = z.infer<typeof ClinicaUpdateSchema>;

export const ClinicaEstadoSchema = z.object({
  activa: z.boolean(),
  motivo: z.string().min(1, 'Debe proporcionar un motivo para el cambio de estado'),
});

export type ClinicaEstadoInput = z.infer<typeof ClinicaEstadoSchema>;
