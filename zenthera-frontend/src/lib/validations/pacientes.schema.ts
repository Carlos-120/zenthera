import { z } from 'zod';

export const PacienteRequestSchema = z.object({
  nombres: z.string().min(2, 'Los nombres deben tener al menos 2 caracteres').max(80, 'Máximo 80 caracteres'),
  apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres').max(80, 'Máximo 80 caracteres'),
  cedula: z.string().regex(/^[0-9]{10}$/, 'La cédula debe tener exactamente 10 dígitos'),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe tener el formato YYYY-MM-DD'),
  sexo: z.enum(['FEMENINO', 'MASCULINO', 'OTRO']),
  telefono: z.string().max(20, 'Máximo 20 caracteres').optional().nullable().or(z.literal('')),
  correo: z.string().email('Correo inválido').max(120, 'Máximo 120 caracteres').optional().nullable().or(z.literal('')),
  direccion: z.string().max(255, 'Máximo 255 caracteres').optional().nullable().or(z.literal('')),
  tipoSangre: z.string().max(5, 'Máximo 5 caracteres').optional().nullable().or(z.literal('')),
  alergias: z.string().optional().nullable().or(z.literal('')),
  contactoEmergencia: z.string().max(120, 'Máximo 120 caracteres').optional().nullable().or(z.literal('')),
  telefonoEmergencia: z.string().max(20, 'Máximo 20 caracteres').optional().nullable().or(z.literal('')),
});

export type PacienteFormValues = z.infer<typeof PacienteRequestSchema>;
