import React, { useState } from 'react';
import { isAxiosError } from 'axios';
import { ConsultaResponse, finalizarConsulta } from '@/lib/api/clinico';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Calendar, User, Activity, FileText, Pill, Edit, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';

interface ConsultaDetalleProps {
  consulta: ConsultaResponse;
  onEdit: () => void;
  onFinalized: (consulta: ConsultaResponse) => void;
}

export function ConsultaDetalle({ consulta, onEdit, onFinalized }: ConsultaDetalleProps) {
  const { usuario } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const isMedico = usuario?.rol === 'MEDICO';
  const isBorrador = consulta.estado === 'BORRADOR';

  const finalizeMutation = useMutation({
    mutationFn: () => finalizarConsulta(consulta.id),
    onSuccess: (res) => {
      onFinalized(res.data);
    },
    onError: (err: unknown) => {
      const message = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setError(message || 'Error al finalizar la consulta');
    }
  });

  const handleFinalize = () => {
    if (window.confirm('¿Está seguro de finalizar esta consulta? Una vez finalizada ya no podrá editarla.')) {
      setError(null);
      finalizeMutation.mutate();
    }
  };

  const sv = consulta.signosVitales;
  const hasSignos = sv && (sv.peso || sv.talla || sv.presionSistolica || sv.presionDiastolica || sv.frecuenciaCardiaca || sv.temperatura || sv.saturacionOxigeno);

  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {/* Cabecera / Estado */}
      <div className="glass rounded-2xl p-6 md:p-8 border border-border relative overflow-hidden">
        {/* Adorno visual según estado */}
        <div className={`absolute top-0 left-0 w-1.5 h-full ${isBorrador ? 'bg-warning' : 'bg-success'}`}></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wide ${
                isBorrador
                  ? 'bg-warning/10 text-warning-foreground border-warning/20'
                  : 'bg-success/10 text-success border-success/20'
              }`}>
                {consulta.estado}
              </span>
              <span className="text-sm font-medium text-foreground/60 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(consulta.createdAt).toLocaleDateString('es-ES', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {consulta.motivoConsulta || 'Consulta médica'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-foreground/70 mt-2">
              <User className="w-4 h-4" />
              <span>Atendido por: <strong>Dr. {consulta.medicoNombres} {consulta.medicoApellidos}</strong></span>
            </div>

            {!isBorrador && consulta.finalizadaAt && (
              <div className="flex items-center gap-2 text-xs text-foreground/50 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Finalizada el: {new Date(consulta.finalizadaAt).toLocaleString('es-ES')}</span>
              </div>
            )}
          </div>

          {isBorrador && isMedico && (
            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={onEdit}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl font-medium bg-surface border border-border hover:bg-surface/70 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={handleFinalize}
                disabled={finalizeMutation.isPending}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl font-medium bg-success text-white hover:bg-success/90 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-success shadow-lg shadow-success/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {finalizeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Columna Izquierda (Síntomas y Signos) */}
        <div className="md:col-span-1 space-y-6">
          <section className="glass rounded-2xl p-6 border border-border h-full">
            <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-error/80" />
              Signos Vitales
            </h3>

            {hasSignos ? (
              <div className="grid grid-cols-2 gap-4">
                {sv.peso != null && (
                  <div>
                    <span className="text-xs text-foreground/50 block">Peso</span>
                    <span className="font-semibold text-foreground">{sv.peso} <span className="text-xs font-normal text-foreground/60">kg</span></span>
                  </div>
                )}
                {sv.talla != null && (
                  <div>
                    <span className="text-xs text-foreground/50 block">Talla</span>
                    <span className="font-semibold text-foreground">{sv.talla} <span className="text-xs font-normal text-foreground/60">cm</span></span>
                  </div>
                )}
                {sv.presionSistolica != null && sv.presionDiastolica != null && (
                  <div className="col-span-2">
                    <span className="text-xs text-foreground/50 block">Presión Arterial</span>
                    <span className="font-semibold text-foreground">{sv.presionSistolica}/{sv.presionDiastolica} <span className="text-xs font-normal text-foreground/60">mmHg</span></span>
                  </div>
                )}
                {sv.frecuenciaCardiaca != null && (
                  <div>
                    <span className="text-xs text-foreground/50 block">Frec. Cardíaca</span>
                    <span className="font-semibold text-foreground">{sv.frecuenciaCardiaca} <span className="text-xs font-normal text-foreground/60">lpm</span></span>
                  </div>
                )}
                {sv.temperatura != null && (
                  <div>
                    <span className="text-xs text-foreground/50 block">Temperatura</span>
                    <span className="font-semibold text-foreground">{sv.temperatura} <span className="text-xs font-normal text-foreground/60">°C</span></span>
                  </div>
                )}
                {sv.saturacionOxigeno != null && (
                  <div>
                    <span className="text-xs text-foreground/50 block">SpO2</span>
                    <span className="font-semibold text-foreground">{sv.saturacionOxigeno} <span className="text-xs font-normal text-foreground/60">%</span></span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-foreground/50 italic">No se registraron signos vitales en esta consulta.</p>
            )}
          </section>
        </div>

        {/* Columna Derecha (Diagnóstico, Tratamiento, Notas) */}
        <div className="md:col-span-2 space-y-6">
          <section className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Enfermedad Actual / Observaciones
            </h3>
            <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
              {consulta.sintomasObservaciones || <span className="italic text-foreground/40">Sin detalles.</span>}
            </p>
          </section>

          <section className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" />
              Diagnóstico y Tratamiento
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-foreground/80 mb-1">Diagnóstico Inicial</h4>
                <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed bg-surface/30 p-3 rounded-xl border border-border/50">
                  {consulta.diagnosticoInicial || <span className="italic text-foreground/40">Sin diagnóstico registrado.</span>}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-foreground/80 mb-1">Tratamiento e Indicaciones</h4>
                <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed bg-surface/30 p-3 rounded-xl border border-border/50">
                  {consulta.tratamientoIndicaciones || <span className="italic text-foreground/40">Sin indicaciones registradas.</span>}
                </p>
              </div>
            </div>
          </section>

          {consulta.notas && (
            <section className="glass rounded-2xl p-6 border border-border bg-surface/30">
              <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-2">
                Notas Adicionales
              </h3>
              <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                {consulta.notas}
              </p>
            </section>
          )}
        </div>

      </div>
    </div>
  );
}
