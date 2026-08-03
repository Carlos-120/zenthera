'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMedico, MedicoRequest } from '@/lib/api/medicos';
import { AlertCircle, ArrowLeft, Loader2, Save, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';

const MedicoRequestSchema = z.object({
  cedula: z.string().min(10, 'La cédula debe tener al menos 10 caracteres').max(13, 'La cédula debe tener máximo 13 caracteres'),
  nombres: z.string().min(2, 'Los nombres son obligatorios').max(80),
  apellidos: z.string().min(2, 'Los apellidos son obligatorios').max(80),
  especialidad: z.string().min(2, 'La especialidad es obligatoria').max(100),
  registroProfesional: z.string().max(20).optional(),
  telefono: z.string().max(20).optional(),
  correo: z.string().email('Correo inválido').max(120),
  direccion: z.string().max(255).optional(),
  activo: z.boolean().optional(),
});

type MedicoFormValues = z.infer<typeof MedicoRequestSchema>;

export default function NuevoMedicoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicoFormValues>({
    resolver: zodResolver(MedicoRequestSchema),
    defaultValues: {
      activo: true,
      especialidad: '',
    }
  });

  const mutation = useMutation({
    mutationFn: createMedico,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] });
      router.push('/dashboard/medicos');
    },
    onError: (error: Error | unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setServerError(axiosError.response?.data?.message || 'Error al registrar el médico.');
    }
  });

  const onSubmit = (data: MedicoFormValues) => {
    setServerError(null);
    const requestData: MedicoRequest = {
      cedula: data.cedula,
      nombres: data.nombres,
      apellidos: data.apellidos,
      especialidad: data.especialidad,
      correo: data.correo,
      activo: data.activo ?? true,
      registroProfesional: data.registroProfesional,
      telefono: data.telefono,
      direccion: data.direccion
    };
    mutation.mutate(requestData);
  };

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA']}>
      <div className="max-w-4xl mx-auto pb-10 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard/medicos" className="inline-flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2 py-1 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a médicos
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <Stethoscope className="w-8 h-8 text-primary" />
              Registrar Médico
            </h1>
            <p className="text-foreground/60 text-sm">
              Ingresa los datos personales y profesionales del nuevo médico.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
          <section className="glass rounded-2xl p-6 md:p-8 border border-border">
            {serverError && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3 mb-6" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error al registrar</p>
                  <p className="text-sm mt-1 opacity-90">{serverError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="cedula" className="block text-sm font-medium text-foreground/80">
                  Cédula / Identificación <span className="text-error">*</span>
                </label>
                <input
                  id="cedula"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.cedula ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. 1712345678"
                  {...register('cedula')}
                />
                {errors.cedula && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.cedula.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="nombres" className="block text-sm font-medium text-foreground/80">
                  Nombres <span className="text-error">*</span>
                </label>
                <input
                  id="nombres"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.nombres ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('nombres')}
                />
                {errors.nombres && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.nombres.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="apellidos" className="block text-sm font-medium text-foreground/80">
                  Apellidos <span className="text-error">*</span>
                </label>
                <input
                  id="apellidos"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.apellidos ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('apellidos')}
                />
                {errors.apellidos && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.apellidos.message}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="especialidad" className="block text-sm font-medium text-foreground/80">
                  Especialidad <span className="text-error">*</span>
                </label>
                <input
                  id="especialidad"
                  type="text"
                  placeholder="Ej. Cardiología, Pediatría"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.especialidad ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('especialidad')}
                />
                {errors.especialidad && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.especialidad.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="correo" className="block text-sm font-medium text-foreground/80">
                  Correo Electrónico <span className="text-error">*</span>
                </label>
                <input
                  id="correo"
                  type="email"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.correo ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('correo')}
                />
                {errors.correo && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.correo.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="telefono" className="block text-sm font-medium text-foreground/80">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.telefono ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('telefono')}
                />
                {errors.telefono && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.telefono.message}</p>}
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="registroProfesional" className="block text-sm font-medium text-foreground/80">
                  Registro Profesional / Senescyt
                </label>
                <input
                  id="registroProfesional"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.registroProfesional ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('registroProfesional')}
                />
                {errors.registroProfesional && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.registroProfesional.message}</p>}
              </div>

            </div>

            <div className="pt-6 mt-6 border-t border-border flex flex-col-reverse md:flex-row items-center justify-end gap-3">
              <Link
                href="/dashboard/medicos"
                className="w-full md:w-auto px-6 py-2.5 rounded-xl font-medium border border-border hover:bg-surface/70 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                {isSubmitting || mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Registrar Médico
                  </>
                )}
              </button>
            </div>
          </section>
        </form>
      </div>
    </RoleGuard>
  );
}
