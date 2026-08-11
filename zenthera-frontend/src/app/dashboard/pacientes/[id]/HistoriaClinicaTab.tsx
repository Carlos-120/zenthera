import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHistoriaClinica, ConsultaResponse } from '@/lib/api/clinico';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Plus, FileText, AlertCircle, Calendar, User } from 'lucide-react';
import { ConsultaForm } from './ConsultaForm';
import { ConsultaDetalle } from './ConsultaDetalle';

export function HistoriaClinicaTab({ pacienteId }: { pacienteId: number }) {
  const { usuario } = useAuthStore();
  const [view, setView] = useState<'lista' | 'nueva' | 'detalle' | 'editar'>('lista');
  const [selectedConsulta, setSelectedConsulta] = useState<ConsultaResponse | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['historiaClinica', pacienteId],
    queryFn: () => getHistoriaClinica(pacienteId),
  });

  const isMedico = usuario?.rol === 'MEDICO';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-foreground/70">Cargando historia clínica...</p>
      </div>
    );
  }

  if (isError) {
    const err = error as { response?: { status?: number, data?: { message?: string } } };
    // It might return 404 if no history exists yet, which is fine, we just show empty.
    if (err?.response?.status !== 404) {
      return (
        <div className="p-6 bg-error/10 border border-error/20 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-error mx-auto mb-2" />
          <h3 className="text-error font-semibold">Error al cargar la historia clínica</h3>
          <p className="text-sm text-error/80 mt-1">{err?.response?.data?.message || 'Error desconocido'}</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-error text-white rounded-xl text-sm hover:bg-error/90">
            Reintentar
          </button>
        </div>
      );
    }
  }

  const consultas = data?.data?.consultas || [];

  if (view === 'nueva') {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setView('lista')}
          className="text-sm text-foreground/60 hover:text-foreground mb-4 inline-block focus:outline-none"
        >
          ← Volver a la historia
        </button>
        <h2 className="text-xl font-bold text-foreground mb-6">Nueva Consulta</h2>
        <ConsultaForm pacienteId={pacienteId} onComplete={() => {
          refetch();
          setView('lista');
        }} onCancel={() => setView('lista')} />
      </div>
    );
  }

  if (view === 'editar' && selectedConsulta) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setView('detalle')}
          className="text-sm text-foreground/60 hover:text-foreground mb-4 inline-block focus:outline-none"
        >
          ← Cancelar edición
        </button>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          Editar Consulta <span className="text-sm font-normal text-foreground/60">(Borrador)</span>
        </h2>
        <ConsultaForm
          pacienteId={pacienteId}
          consultaId={selectedConsulta.id}
          initialData={selectedConsulta}
          onComplete={(updatedConsulta) => {
            refetch();
            setSelectedConsulta(updatedConsulta);
            setView('detalle');
          }}
          onCancel={() => setView('detalle')}
        />
      </div>
    );
  }

  if (view === 'detalle' && selectedConsulta) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setView('lista')}
          className="text-sm text-foreground/60 hover:text-foreground mb-4 inline-block focus:outline-none"
        >
          ← Volver a la historia
        </button>
        <ConsultaDetalle
          consulta={selectedConsulta}
          onEdit={() => setView('editar')}
          onFinalized={(updated) => {
            refetch();
            setSelectedConsulta(updated);
          }}
        />
      </div>
    );
  }

  // Lista View
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Consultas Clínicas</h2>
        {isMedico && (
          <button
            onClick={() => setView('nueva')}
            className="px-4 py-2 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Plus className="w-4 h-4" />
            Nueva consulta
          </button>
        )}
      </div>

      {consultas.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl bg-surface/30">
          <FileText className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">No hay consultas registradas</h3>
          <p className="text-foreground/60 mt-1 max-w-md mx-auto">
            Este paciente no tiene historial de consultas clínicas registradas en el sistema.
          </p>
          {isMedico && (
            <button
              onClick={() => setView('nueva')}
              className="mt-6 px-5 py-2.5 rounded-xl font-medium border border-primary text-primary hover:bg-primary/5 transition-colors inline-flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Plus className="w-4 h-4" />
              Crear la primera consulta
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {consultas.map((consulta: ConsultaResponse) => (
            <div
              key={consulta.id}
              className="glass rounded-xl p-5 border border-border hover:border-primary/30 transition-all flex flex-col md:flex-row gap-4 justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    consulta.estado === 'FINALIZADA'
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-warning/10 text-warning-foreground border-warning/20'
                  }`}>
                    {consulta.estado}
                  </span>
                  <span className="text-sm font-medium text-foreground/60 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(consulta.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

                <h4 className="font-semibold text-lg text-foreground mt-1">
                  {consulta.motivoConsulta || 'Consulta médica general'}
                </h4>

                <div className="flex items-center gap-2 text-sm text-foreground/70">
                  <User className="w-3.5 h-3.5" />
                  <span>Atendido por: <strong>Dr. {consulta.medicoNombres} {consulta.medicoApellidos}</strong></span>
                </div>
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => {
                    setSelectedConsulta(consulta);
                    setView('detalle');
                  }}
                  className="w-full md:w-auto px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface/70 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
