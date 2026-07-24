'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getAllClinicas, updateEstadoClinica, ClinicaResponse } from '@/lib/api/clinicas';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Building2, Search, Plus, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AxiosError } from 'axios';
import { EstadoModal } from '@/components/clinica/EstadoModal';
import { useDebounce } from '@/hooks/useDebounce';

export default function ClinicasPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(0);
  const size = 10;

  const [selectedClinica, setSelectedClinica] = useState<ClinicaResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);



  const { data: response, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['clinicas', { search: debouncedSearch, page, size }],
    queryFn: () => getAllClinicas({ search: debouncedSearch, page, size }),
    placeholderData: keepPreviousData,
  });

  const estadoMutation = useMutation({
    mutationFn: ({ id, activa, motivo }: { id: number, activa: boolean, motivo: string }) =>
      updateEstadoClinica(id, { activa, motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicas'] });
      setIsModalOpen(false);
      setSelectedClinica(null);
      setActionError(null);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message: string }>;
      setActionError(axiosError.response?.data?.message || 'Ocurrió un error al cambiar el estado.');
    }
  });

  const handleOpenModal = (clinica: ClinicaResponse) => {
    setSelectedClinica(clinica);
    setIsModalOpen(true);
  };

  const handleConfirmEstado = (motivo: string) => {
    if (!selectedClinica) return;
    estadoMutation.mutate({
      id: selectedClinica.id,
      activa: !selectedClinica.activa,
      motivo
    });
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8">
        <header className="mb-8 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Clínicas</h1>
            </div>
            <p className="text-foreground/60 text-lg ml-1">
              Gestión centralizada de instituciones médicas afiliadas a Zenthera.
            </p>
          </div>
          <button
            disabled
            className="inline-flex items-center gap-2 bg-primary/50 text-primary-foreground/50 font-semibold px-6 py-3 rounded-xl cursor-not-allowed self-start sm:self-auto"
            title="Funcionalidad bloqueada hasta aprobar Onboarding"
          >
            <Plus className="w-5 h-5" />
            Nueva Clínica
          </button>
        </header>

        {/* Buscador */}
        <div className="mb-6 bg-surface border border-border rounded-xl p-2 flex items-center shadow-sm">
          <div className="pl-3 text-foreground/40">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Buscar por RUC o Nombre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full bg-transparent border-none px-3 py-2 text-foreground focus:outline-none focus:ring-0"
          />
          {isFetching && (
            <div className="pr-3">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="glass rounded-2xl border border-border overflow-hidden shadow-sm animate-fade-in">
          {isError ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="w-12 h-12 text-error mb-4" />
              <h3 className="text-lg font-bold mb-2">Error al cargar las clínicas</h3>
              <button onClick={() => refetch()} className="text-primary hover:underline font-medium">Reintentar</button>
            </div>
          ) : isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-foreground/50">Cargando datos...</p>
            </div>
          ) : !response?.data?.content?.length ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Building2 className="w-16 h-16 text-foreground/20 mb-4" />
              <h3 className="text-xl font-bold mb-2">No se encontraron clínicas</h3>
              <p className="text-foreground/50 max-w-sm">No hay resultados para la búsqueda actual o aún no hay clínicas registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface/50 border-b border-border">
                    <th className="px-6 py-4 font-semibold text-sm text-foreground/70 uppercase tracking-wider">RUC</th>
                    <th className="px-6 py-4 font-semibold text-sm text-foreground/70 uppercase tracking-wider">Clínica</th>
                    <th className="px-6 py-4 font-semibold text-sm text-foreground/70 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-4 font-semibold text-sm text-foreground/70 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 font-semibold text-sm text-foreground/70 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {response.data.content.map((clinica) => (
                    <tr key={clinica.id} className="hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium font-mono text-foreground/80">
                        {clinica.ruc}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{clinica.nombre}</div>
                        <div className="text-xs text-foreground/50 truncate max-w-[200px]" title={clinica.razonSocial}>{clinica.razonSocial}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/80">
                        <div>{clinica.correo}</div>
                        <div className="text-foreground/50">{clinica.telefono}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          clinica.activa
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-error/10 text-error border-error/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${clinica.activa ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
                          {clinica.activa ? 'ACTIVA' : 'SUSPENDIDA'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenModal(clinica)}
                          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border ${
                            clinica.activa
                              ? 'text-error border-error/20 hover:bg-error/10'
                              : 'text-success border-success/20 hover:bg-success/10'
                          }`}
                        >
                          {clinica.activa ? 'Suspender' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {response?.data && response.data.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border bg-surface/30 flex items-center justify-between">
              <div className="text-sm text-foreground/60">
                Página <span className="font-semibold text-foreground">{response.data.page + 1}</span> de <span className="font-semibold text-foreground">{response.data.totalPages}</span>
                {' '}({response.data.totalElements} resultados)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={response.data.first}
                  className="p-2 rounded-lg border border-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={response.data.last}
                  className="p-2 rounded-lg border border-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <EstadoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          clinica={selectedClinica}
          onConfirm={handleConfirmEstado}
          isPending={estadoMutation.isPending}
          externalError={actionError}
        />
      )}
    </RoleGuard>
  );
}
