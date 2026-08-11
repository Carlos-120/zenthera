import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ConsultaRequestSchema, ConsultaFormValues } from '@/lib/validations/clinico.schema';
import { createConsulta, updateConsulta, ConsultaResponse } from '@/lib/api/clinico';
import { AlertCircle, Loader2, Save, Activity, FileText, Pill } from 'lucide-react';

interface ConsultaFormProps {
  pacienteId: number;
  consultaId?: number;
  initialData?: ConsultaResponse;
  onComplete: (data: ConsultaResponse) => void;
  onCancel: () => void;
}

export function ConsultaForm({ pacienteId, consultaId, initialData, onComplete, onCancel }: ConsultaFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConsultaFormValues>({
    resolver: zodResolver(ConsultaRequestSchema),
    defaultValues: {
      motivoConsulta: initialData?.motivoConsulta || '',
      sintomasObservaciones: initialData?.sintomasObservaciones || '',
      diagnosticoInicial: initialData?.diagnosticoInicial || '',
      tratamientoIndicaciones: initialData?.tratamientoIndicaciones || '',
      notas: initialData?.notas || '',
      signosVitales: {
        peso: initialData?.signosVitales?.peso ?? undefined,
        talla: initialData?.signosVitales?.talla ?? undefined,
        presionSistolica: initialData?.signosVitales?.presionSistolica ?? undefined,
        presionDiastolica: initialData?.signosVitales?.presionDiastolica ?? undefined,
        frecuenciaCardiaca: initialData?.signosVitales?.frecuenciaCardiaca ?? undefined,
        temperatura: initialData?.signosVitales?.temperatura ?? undefined,
        saturacionOxigeno: initialData?.signosVitales?.saturacionOxigeno ?? undefined,
      }
    }
  });

  const mutation = useMutation({
    mutationFn: (data: ConsultaFormValues) =>
      consultaId
        ? updateConsulta(consultaId, data)
        : createConsulta(pacienteId, data),
    onSuccess: (res) => {
      onComplete(res.data);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setServerError(err?.response?.data?.message || 'Error al guardar la consulta');
    }
  });

  const onSubmit = (data: ConsultaFormValues) => {
    setServerError(null);

    // Transform empty strings or undefined to null for backend if needed
    const transformNumeric = (val: number | string | undefined | null) => {
      if (val === '' || val === undefined || val === null || isNaN(Number(val))) return null;
      return Number(val);
    };

    const payload = {
      ...data,
      signosVitales: data.signosVitales ? {
        peso: transformNumeric(data.signosVitales.peso),
        talla: transformNumeric(data.signosVitales.talla),
        presionSistolica: transformNumeric(data.signosVitales.presionSistolica),
        presionDiastolica: transformNumeric(data.signosVitales.presionDiastolica),
        frecuenciaCardiaca: transformNumeric(data.signosVitales.frecuenciaCardiaca),
        temperatura: transformNumeric(data.signosVitales.temperatura),
        saturacionOxigeno: transformNumeric(data.signosVitales.saturacionOxigeno),
      } : undefined
    };

    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error al guardar</p>
            <p className="text-sm mt-1 opacity-90">{serverError}</p>
          </div>
        </div>
      )}

      {/* Consulta Info */}
      <section className="glass rounded-2xl p-6 md:p-8 border border-border">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-3 mb-5 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Motivo y Observaciones
        </h3>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="motivoConsulta" className="block text-sm font-medium text-foreground/80">
              Motivo de la consulta
            </label>
            <input
              id="motivoConsulta"
              type="text"
              className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 transition-all ${
                errors.motivoConsulta ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
              }`}
              placeholder="Ej. Dolor de cabeza y fiebre"
              {...register('motivoConsulta')}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sintomasObservaciones" className="block text-sm font-medium text-foreground/80">
              Síntomas y observaciones (Enfermedad actual)
            </label>
            <textarea
              id="sintomasObservaciones"
              rows={4}
              className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 transition-all resize-none ${
                errors.sintomasObservaciones ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
              }`}
              placeholder="Describa los síntomas detalladamente..."
              {...register('sintomasObservaciones')}
            />
          </div>
        </div>
      </section>

      {/* Signos Vitales */}
      <section className="glass rounded-2xl p-6 md:p-8 border border-border">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-3 mb-5 flex items-center gap-2">
          <Activity className="w-5 h-5 text-error/80" />
          Signos Vitales
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface/50 focus:ring-2 focus:ring-primary focus:outline-none"
              {...register('signosVitales.peso', { valueAsNumber: true })}
            />
            {errors.signosVitales?.peso && <p className="text-xs text-error">{errors.signosVitales.peso.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80">Talla (cm)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface/50 focus:ring-2 focus:ring-primary focus:outline-none"
              {...register('signosVitales.talla', { valueAsNumber: true })}
            />
            {errors.signosVitales?.talla && <p className="text-xs text-error">{errors.signosVitales.talla.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80">P. Sistólica (mmHg)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface/50 focus:ring-2 focus:ring-primary focus:outline-none"
              {...register('signosVitales.presionSistolica', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80">P. Diastólica (mmHg)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface/50 focus:ring-2 focus:ring-primary focus:outline-none"
              {...register('signosVitales.presionDiastolica', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80">Frec. Cardíaca (lpm)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface/50 focus:ring-2 focus:ring-primary focus:outline-none"
              {...register('signosVitales.frecuenciaCardiaca', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80">Temperatura (°C)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface/50 focus:ring-2 focus:ring-primary focus:outline-none"
              {...register('signosVitales.temperatura', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/80">SpO2 (%)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface/50 focus:ring-2 focus:ring-primary focus:outline-none"
              {...register('signosVitales.saturacionOxigeno', { valueAsNumber: true })}
            />
            {errors.signosVitales?.saturacionOxigeno && <p className="text-xs text-error">{errors.signosVitales.saturacionOxigeno.message}</p>}
          </div>
        </div>
      </section>

      {/* Diagnóstico y Tratamiento */}
      <section className="glass rounded-2xl p-6 md:p-8 border border-border">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-3 mb-5 flex items-center gap-2">
          <Pill className="w-5 h-5 text-primary" />
          Diagnóstico y Tratamiento
        </h3>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="diagnosticoInicial" className="block text-sm font-medium text-foreground/80">
              Diagnóstico
            </label>
            <textarea
              id="diagnosticoInicial"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              placeholder="Ej. Infección respiratoria aguda"
              {...register('diagnosticoInicial')}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tratamientoIndicaciones" className="block text-sm font-medium text-foreground/80">
              Tratamiento e indicaciones
            </label>
            <textarea
              id="tratamientoIndicaciones"
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              placeholder="Medicamentos, dosis y recomendaciones..."
              {...register('tratamientoIndicaciones')}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notas" className="block text-sm font-medium text-foreground/80">
              Notas adicionales (Opcional)
            </label>
            <textarea
              id="notas"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              placeholder="Notas privadas o evolución esperada..."
              {...register('notas')}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="w-full md:w-auto px-6 py-2.5 rounded-xl font-medium border border-border hover:bg-surface/70 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {isSubmitting || mutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Borrador
            </>
          )}
        </button>
      </div>
    </form>
  );
}
