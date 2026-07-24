'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClinicaById, updateEstadoClinica, ClinicaEstadoRequest } from '@/lib/api/clinicas';
import { Building2, ArrowLeft, AlertCircle, CheckCircle2, XCircle, MapPin, Mail, Phone, Globe, Clock, Power, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ClinicaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const clinicaId = parseInt(resolvedParams.id, 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['clinica', clinicaId],
    queryFn: () => getClinicaById(clinicaId),
    retry: 1, // Minimize retries on 404
  });

  const estadoMutation = useMutation({
    mutationFn: (req: ClinicaEstadoRequest) => updateEstadoClinica(clinicaId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinica', clinicaId] });
      queryClient.invalidateQueries({ queryKey: ['clinicas'] });
      setIsModalOpen(false);
      setMotivo('');
      setModalError(null);
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.message || err.message || 'Ocurrió un error al cambiar el estado.');
    }
  });

  const clinica = data?.data;

  const handleToggleEstado = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!motivo.trim()) {
      setModalError('Debe ingresar un motivo para justificar el cambio de estado.');
      return;
    }

    if (!clinica) return;

    estadoMutation.mutate({
      activa: !clinica.activa,
      motivo: motivo.trim()
    });
  };

  const openModal = () => {
    setMotivo('');
    setModalError(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        <header className="mb-8">
          <div className="h-4 w-32 bg-surface animate-pulse rounded mb-4" />
          <div className="h-10 w-64 bg-surface animate-pulse rounded mb-2" />
          <div className="h-5 w-96 bg-surface animate-pulse rounded" />
        </header>
        <div className="h-64 w-full bg-surface animate-pulse rounded-2xl border border-border" />
      </div>
    );
  }

  // Si da 404 o cualquier error (el requerimiento dice "Mostrar loading, error y not found")
  if (isError || !clinica) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        <Link href="/admin/clinicas" className="inline-flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver a clínicas
        </Link>
        <div className="p-10 rounded-2xl glass border border-border flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Clínica no encontrada</h2>
          <p className="text-foreground/60 max-w-md">
            No pudimos encontrar la información de la clínica solicitada. Puede que haya sido eliminada o que el identificador sea incorrecto.
          </p>
          <Link href="/admin/clinicas" className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = clinica.activa ? 'success' : 'error';
  const statusIcon = clinica.activa ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  const statusText = clinica.activa ? 'Activa' : 'Suspendida';
  const nextStatusText = clinica.activa ? 'Suspender' : 'Reactivar';
  const actionColor = clinica.activa ? 'bg-error hover:bg-error/90 text-error-foreground' : 'bg-success hover:bg-success/90 text-success-foreground';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <Link href="/admin/clinicas" className="inline-flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a clínicas
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              {clinica.logo ? (
                <img src={clinica.logo} alt={clinica.nombre} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-7 h-7" />
              )}
            </div>
            {clinica.nombre}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-foreground/60 text-lg">{clinica.razonSocial}</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-${statusColor}/10 text-${statusColor} border border-${statusColor}/20`}>
              {statusIcon}
              {statusText}
            </span>
          </div>
        </div>

        <button
          onClick={openModal}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-black/5 flex items-center gap-2 ${actionColor}`}
        >
          <Power className="w-4 h-4" />
          {nextStatusText} Clínica
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Legal / Identificación */}
        <section className="glass rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold">Identificación Legal</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-foreground/50 mb-1">Registro Único de Contribuyentes (RUC)</p>
              <p className="font-medium">{clinica.ruc}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50 mb-1">Razón Social</p>
              <p className="font-medium">{clinica.razonSocial}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50 mb-1">Nombre Comercial</p>
              <p className="font-medium">{clinica.nombre}</p>
            </div>
          </div>
        </section>

        {/* Card: Contacto */}
        <section className="glass rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
              <Phone className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold">Contacto</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-foreground/50 mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Correo Principal</p>
              <p className="font-medium">{clinica.correo || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50 mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Teléfono</p>
              <p className="font-medium">{clinica.telefono || 'No registrado'}</p>
            </div>
          </div>
        </section>

        {/* Card: Ubicación */}
        <section className="glass rounded-2xl p-6 border border-border md:col-span-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="p-2 bg-success/10 text-success rounded-lg border border-success/20">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold">Ubicación y Operación</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <p className="text-sm text-foreground/50 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Dirección</p>
              <p className="font-medium">{clinica.direccion || 'No especificada'}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50 mb-1">Ciudad</p>
              <p className="font-medium">{clinica.ciudad || 'No especificada'}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/50 mb-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> País</p>
              <p className="font-medium">{clinica.pais || 'No especificado'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-foreground/50 mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Zona Horaria</p>
              <p className="font-medium">{clinica.zonaHoraria || 'America/Guayaquil'}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Modal Cambio de Estado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className={`p-6 border-b border-border flex items-start gap-4 ${clinica.activa ? 'bg-error/5' : 'bg-success/5'}`}>
              <div className={`p-3 rounded-full shrink-0 ${clinica.activa ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">
                  ¿{clinica.activa ? 'Suspender' : 'Reactivar'} Clínica?
                </h3>
                <p className="text-sm text-foreground/70">
                  Estás a punto de <strong>{clinica.activa ? 'desactivar' : 'activar'}</strong> el acceso y las operaciones de <strong>{clinica.nombre}</strong>.
                </p>
              </div>
            </div>

            <form onSubmit={handleToggleEstado} className="p-6 flex flex-col gap-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label htmlFor="motivo" className="block text-sm font-medium mb-2">
                  Motivo de la acción *
                </label>
                <textarea
                  id="motivo"
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none"
                  placeholder={`Justificación para ${clinica.activa ? 'suspender' : 'reactivar'}...`}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 mt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={estadoMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-background rounded-lg border border-border transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={estadoMutation.isPending}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50 ${actionColor}`}
                >
                  {estadoMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
