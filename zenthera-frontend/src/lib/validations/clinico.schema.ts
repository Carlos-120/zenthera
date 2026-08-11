import * as z from 'zod';

const optionalNumber = (msg: string) =>
  z.number({ message: 'Debe ser un número válido' })
    .min(0, msg)
    .nullable()
    .optional()
    .or(z.nan().transform(() => undefined));

export const SignosVitalesSchema = z.object({
  peso: optionalNumber('El peso no puede ser negativo'),
  talla: optionalNumber('La talla no puede ser negativa'),
  presionSistolica: optionalNumber('La presión sistólica no puede ser negativa'),
  presionDiastolica: optionalNumber('La presión diastólica no puede ser negativa'),
  frecuenciaCardiaca: optionalNumber('La frecuencia cardíaca no puede ser negativa'),
  temperatura: optionalNumber('La temperatura no puede ser negativa'),
  saturacionOxigeno: z.number({ message: 'Debe ser un número válido' })
    .min(0, 'La saturación no puede ser negativa')
    .max(100, 'Máximo 100%')
    .nullable()
    .optional()
    .or(z.nan().transform(() => undefined)),
});

export const ConsultaRequestSchema = z.object({
  motivoConsulta: z.string().optional(),
  sintomasObservaciones: z.string().optional(),
  signosVitales: SignosVitalesSchema.optional(),
  diagnosticoInicial: z.string().optional(),
  tratamientoIndicaciones: z.string().optional(),
  notas: z.string().optional(),
});

export type ConsultaFormValues = z.infer<typeof ConsultaRequestSchema>;
