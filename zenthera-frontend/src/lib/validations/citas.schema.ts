import { z } from 'zod';

// For parsing input datetime-local to check if it's in the future
const isFutureDate = (val: string) => {
  if (!val) return false;
  const date = new Date(val);
  return date > new Date();
};

export const CitaCreateRequestSchema = z.object({
  pacienteId: z.number().min(1, 'Debe seleccionar un paciente'),
  medicoId: z.number().min(1, 'Debe seleccionar un médico'),
  fechaHoraInicio: z.string().min(1, 'La fecha y hora de inicio es obligatoria').refine(isFutureDate, { message: 'La fecha y hora de inicio debe ser en el futuro' }),
  duracionMinutos: z.number().min(15, 'La duración mínima es de 15 minutos').max(480, 'La duración máxima es de 480 minutos (8 horas)'),
  motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres').max(255, 'Máximo 255 caracteres'),
  observaciones: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable().or(z.literal('')),
});

export type CitaCreateFormValues = z.infer<typeof CitaCreateRequestSchema>;

// Update reuses the same schema structurally for the frontend form, since fields are identical
export const CitaUpdateRequestSchema = CitaCreateRequestSchema;

export type CitaUpdateFormValues = z.infer<typeof CitaUpdateRequestSchema>;

export const EstadoCitaRequestSchema = z.object({
  estado: z.enum(['PROGRAMADA', 'CONFIRMADA', 'EN_ATENCION', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO']),
  motivoCancelacion: z.string().max(255, 'Máximo 255 caracteres').optional().nullable().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.estado === 'CANCELADA') {
    if (!data.motivoCancelacion || data.motivoCancelacion.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El motivo de cancelación es obligatorio cuando el estado es CANCELADA',
        path: ['motivoCancelacion'],
      });
    }
  }
});

export type EstadoCitaFormValues = z.infer<typeof EstadoCitaRequestSchema>;
