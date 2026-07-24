import * as z from 'zod';

export const UsuarioCreateSchema = z.object({
  rolId: z.number({ message: 'El rol es obligatorio.' }),
  nombres: z.string().min(2, 'Los nombres deben tener al menos 2 caracteres.').max(120, 'Máximo 120 caracteres.'),
  apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres.').max(120, 'Máximo 120 caracteres.'),
  cedula: z.string().length(10, 'La cédula debe tener 10 dígitos.'),
  telefono: z.string().max(20, 'Máximo 20 caracteres.').optional(),
  correo: z.string().email('Debe ser un correo electrónico válido.').max(120, 'Máximo 120 caracteres.'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula.')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula.')
    .regex(/[0-9]/, 'Debe contener al menos un número.')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial.'),
  foto: z.string().optional()
});

export const UsuarioUpdateSchema = z.object({
  rolId: z.number({ message: 'El rol es obligatorio.' }),
  nombres: z.string().min(2, 'Los nombres deben tener al menos 2 caracteres.').max(120, 'Máximo 120 caracteres.'),
  apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres.').max(120, 'Máximo 120 caracteres.'),
  cedula: z.string().length(10, 'La cédula debe tener 10 dígitos.'),
  telefono: z.string().max(20, 'Máximo 20 caracteres.').optional(),
  correo: z.string().email('Debe ser un correo electrónico válido.').max(120, 'Máximo 120 caracteres.'),
  foto: z.string().optional()
});

export type UsuarioCreateFormData = z.infer<typeof UsuarioCreateSchema>;
export type UsuarioUpdateFormData = z.infer<typeof UsuarioUpdateSchema>;
