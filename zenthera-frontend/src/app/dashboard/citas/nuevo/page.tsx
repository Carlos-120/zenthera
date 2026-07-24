'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CitaCreateRequestSchema, CitaCreateFormValues } from '@/lib/validations/citas.schema';
import { createCita, CitaCreateRequest } from '@/lib/api/citas';
import { getPacientes } from '@/lib/api/pacientes';
import { getMedicos } from '@/lib/api/medicos';
import { AlertCircle, ArrowLeft, Loader2, Save, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function NuevaCitaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CitaCreateFormValues>({
    resolver: zodResolver(CitaCreateRequestSchema),
    defaultValues: {
      duracionMinutos: 30,
      motivo: '',
      observaciones: '',
    }
  });

  const { data: pacientesData, isLoading: loadingPacientes } = useQuery({
    queryKey: ['pacientes-options'],
    queryFn: () => getPacientes({ page: 0, size: 50, activo: true })
  });

  const { data: medicosData, isLoading: loadingMedicos } = useQuery({
    queryKey: ['medicos-options'],
    queryFn: () => getMedicos({ page: 0, size: 50, activo: true })
  });

  const mutation = useMutation({
    mutationFn: createCita,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      const newId = data?.data?.id || (data as any)?.id;
      if (!newId) {
        router.push('/dashboard/citas');
      } else {
        router.push(`/dashboard/citas/${newId}`);
      }
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.message || 'Error al agendar la cita. Verifique la disponibilidad.');
    }
  });

  const onSubmit = (data: CitaCreateFormValues) => {
    setServerError(null);

    // Parse local datetime string to ISO UTC
    const dateObj = new Date(data.fechaHoraInicio);

    const requestData: CitaCreateRequest = {
      ...data,
      fechaHoraInicio: dateObj.toISOString()
    };

    mutation.mutate(requestData);
  };

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA', 'RECEPCIONISTA']}>
      <div className="max-w-4xl mx-auto pb-10 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard/citas" className="inline-flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2 py-1 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a citas
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <CalendarPlus className="w-8 h-8 text-primary" />
              Agendar Cita
            </h1>
            <p className="text-foreground/60 text-sm">
              Selecciona el paciente, médico y horario para la nueva cita médica.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
          <section className="glass rounded-2xl p-6 md:p-8 border border-border">
            {serverError && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3 mb-6" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Conflicto o error al agendar</p>
                  <p className="text-sm mt-1 opacity-90">{serverError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Paciente */}
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="pacienteId" className="block text-sm font-medium text-foreground/80">
                  Paciente <span className="text-error">*</span>
                </label>
                <select
                  id="pacienteId"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.pacienteId ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('pacienteId', { valueAsNumber: true })}
                  disabled={loadingPacientes}
                >
                  <option value="">Seleccione un paciente...</option>
                  {pacientesData?.data?.content?.map(p => (
                    <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} ({p.cedula})</option>
                  ))}
                </select>
                {errors.pacienteId && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.pacienteId.message}</p>}
              </div>

              {/* Médico */}
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="medicoId" className="block text-sm font-medium text-foreground/80">
                  Médico <span className="text-error">*</span>
                </label>
                <select
                  id="medicoId"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.medicoId ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('medicoId', { valueAsNumber: true })}
                  disabled={loadingMedicos}
                >
                  <option value="">Seleccione un médico...</option>
                  {medicosData?.data?.content?.map(m => (
                    <option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>
                  ))}
                </select>
                {errors.medicoId && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.medicoId.message}</p>}
              </div>

              {/* Fecha y Hora */}
              <div className="space-y-1.5">
                <label htmlFor="fechaHoraInicio" className="block text-sm font-medium text-foreground/80">
                  Fecha y Hora <span className="text-error">*</span>
                </label>
                <input
                  id="fechaHoraInicio"
                  type="datetime-local"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.fechaHoraInicio ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('fechaHoraInicio')}
                />
                {errors.fechaHoraInicio && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.fechaHoraInicio.message}</p>}
              </div>

              {/* Duración */}
              <div className="space-y-1.5">
                <label htmlFor="duracionMinutos" className="block text-sm font-medium text-foreground/80">
                  Duración (minutos) <span className="text-error">*</span>
                </label>
                <input
                  id="duracionMinutos"
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.duracionMinutos ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('duracionMinutos', { valueAsNumber: true })}
                />
                {errors.duracionMinutos && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.duracionMinutos.message}</p>}
              </div>

              {/* Motivo */}
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="motivo" className="block text-sm font-medium text-foreground/80">
                  Motivo de Consulta <span className="text-error">*</span>
                </label>
                <input
                  id="motivo"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.motivo ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. Chequeo general, Dolor de cabeza..."
                  {...register('motivo')}
                />
                {errors.motivo && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.motivo.message}</p>}
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="observaciones" className="block text-sm font-medium text-foreground/80">
                  Observaciones Clínicas (Opcional)
                </label>
                <textarea
                  id="observaciones"
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.observaciones ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Instrucciones previas o notas para el médico..."
                  {...register('observaciones')}
                />
                {errors.observaciones && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.observaciones.message}</p>}
              </div>

            </div>

            <div className="pt-6 mt-6 border-t border-border flex flex-col-reverse md:flex-row items-center justify-end gap-3">
              <Link
                href="/dashboard/citas"
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
                    Agendando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Agendar Cita
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
