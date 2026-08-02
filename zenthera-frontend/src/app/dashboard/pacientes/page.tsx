'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPacientes, updateEstadoPaciente } from '@/lib/api/pacientes';
import { Search, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Filter, ArrowUpDown, Plus, UserSquare2, Power, PowerOff } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/store/authStore';

export default function PacientesPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const isAdminClinica = usuario?.rol === 'ADMIN_CLINICA';

  const [modalPaciente, setModalPaciente] = useState<{ id: number; nombre: string; activo: boolean } | null>(null);
  const [estadoError, setEstadoError] = useState<string | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const [activoFiltro, setActivoFiltro] = useState<boolean | undefined>(undefined);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('paciente_creado') === 'true') {
        setTimeout(() => setShowSuccess(true), 0);
        sessionStorage.removeItem('paciente_creado');
        setTimeout(() => setShowSuccess(false), 5000);
      }
    }
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pacientes', page, size, searchTerm, activoFiltro, sortField, sortDirection],
    queryFn: () => getPacientes({
      page,
      size,
      search: searchTerm || undefined,
      activo: activoFiltro,
      sort: sortField,
      direction: sortDirection
    }),
    placeholderData: (prev) => prev,
  });

  const pacientes = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;
  const isLast = data?.data?.last ?? true;
  const isFirst = data?.data?.first ?? true;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const toggleEstadoFiltro = () => {
    setActivoFiltro(prev => prev === undefined ? true : prev === true ? false : undefined);
    setPage(0);
  };

  const calculateAge = (birthDateString: string | null | undefined) => {
    if (!birthDateString) return '—';
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return '—';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const estadoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => updateEstadoPaciente(id, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setModalPaciente(null);
      setEstadoError(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setEstadoError(err.response?.data?.message || 'Ocurrió un error al cambiar el estado.');
    }
  });

  const handleOpenModal = (paciente: { id: number; nombre: string; activo: boolean }, target: HTMLButtonElement) => {
    triggerRef.current = target;
    setModalPaciente(paciente);
    setEstadoError(null);
  };

  const handleCloseModal = () => {
    setModalPaciente(null);
    setEstadoError(null);
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA', 'MEDICO', 'RECEPCIONISTA']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {showSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Paciente registrado correctamente</h3>
              <p className="text-sm opacity-90">El paciente se ha agregado a la lista.</p>
            </div>
          </div>
        )}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <UserSquare2 className="w-8 h-8 text-primary" />
              Directorio de Pacientes
            </h1>
            <p className="text-foreground/60">
              Gestiona el registro e información de los pacientes de la clínica.
            </p>
          </div>
          <div>
            <Link
              href="/dashboard/pacientes/nuevo"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              Nuevo Paciente
            </Link>
          </div>
        </header>

        {/* Toolbar */}
        <div className="glass p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-border">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-foreground/40" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2.5 border border-border rounded-xl leading-5 bg-surface/50 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary sm:text-sm transition-colors"
              placeholder="Buscar por nombres, apellidos o cédula..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={toggleEstadoFiltro}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                activoFiltro === undefined
                  ? 'border-border bg-surface text-foreground hover:bg-surface/70'
                  : activoFiltro
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-error/30 bg-error/10 text-error'
              }`}
            >
              <Filter className="w-4 h-4" />
              {activoFiltro === undefined ? 'Todos los estados' : activoFiltro ? 'Solo Activos' : 'Solo Inactivos'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="glass rounded-2xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface/50 border-b border-border text-foreground/70 text-sm font-medium">
                  <th className="py-4 px-6 text-sm font-medium" aria-sort={sortField === 'cedula' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none"
                      onClick={() => handleSort('cedula')}
                      aria-label="Ordenar por Cédula"
                    >
                      Cédula <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium" aria-sort={sortField === 'nombres' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none"
                      onClick={() => handleSort('nombres')}
                      aria-label="Ordenar por Paciente"
                    >
                      Paciente <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium text-foreground/70">Edad</th>
                  <th className="py-4 px-6 text-sm font-medium text-foreground/70">Contacto</th>
                  <th className="py-4 px-6 text-sm font-medium">
                    <span className="flex items-center gap-1 select-none">
                      Estado
                    </span>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium text-right" aria-sort={sortField === 'createdAt' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center justify-end gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none ml-auto"
                      onClick={() => handleSort('createdAt')}
                      aria-label="Ordenar por Fecha Registro"
                    >
                      Registro <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium text-right text-foreground/70">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-4 px-6"><div className="h-4 w-20 bg-surface animate-pulse rounded" /></td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-surface animate-pulse rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6"><div className="h-4 w-12 bg-surface animate-pulse rounded" /></td>
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <div className="h-4 w-40 bg-surface animate-pulse rounded" />
                          <div className="h-3 w-24 bg-surface animate-pulse rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-6"><div className="h-6 w-20 bg-surface animate-pulse rounded-full" /></td>
                      <td className="py-4 px-6 text-right"><div className="h-4 w-24 bg-surface animate-pulse rounded ml-auto" /></td>
                      <td className="py-4 px-6"><div className="h-8 w-16 bg-surface animate-pulse rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">Error al cargar pacientes</h3>
                        <p className="text-foreground/60 text-sm max-w-sm">
                          {error instanceof Error ? error.message : 'No se pudo obtener la lista de pacientes. Por favor, inténtalo de nuevo.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : pacientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                          <UserSquare2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No se encontraron pacientes</h3>
                        <p className="text-foreground/60 max-w-md">
                          No hay registros que coincidan con tu búsqueda o filtros actuales.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pacientes.map((paciente) => (
                    <tr key={paciente.id} className="border-b border-border/50 hover:bg-surface/30 transition-colors group">
                      <td className="py-4 px-6 font-medium text-foreground/80">
                        {paciente.cedula}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 overflow-hidden font-bold text-sm">
                            {paciente.nombres.charAt(0)}{paciente.apellidos.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">{paciente.nombres} {paciente.apellidos}</p>
                            <p className="text-xs text-foreground/50">{paciente.sexo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-foreground/80">
                        {calculateAge(paciente.fechaNacimiento) === '—' ? '—' : `${calculateAge(paciente.fechaNacimiento)} años`}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-foreground/80">{paciente.correo || 'Sin correo'}</p>
                        <p className="text-xs text-foreground/50">{paciente.telefono || 'Sin teléfono'}</p>
                      </td>
                      <td className="py-4 px-6">
                        {paciente.activo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right text-sm text-foreground/60">
                        {formatDate(paciente.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/pacientes/${paciente.id}`}
                            className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                            title="Editar paciente"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-edit w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </Link>
                          {isAdminClinica && (
                            <button
                              onClick={(e) => handleOpenModal({ id: paciente.id, nombre: `${paciente.nombres} ${paciente.apellidos}`, activo: paciente.activo }, e.currentTarget)}
                              className={`p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                                paciente.activo
                                  ? 'text-error/70 hover:text-error hover:bg-error/10'
                                  : 'text-success/70 hover:text-success hover:bg-success/10'
                              }`}
                              title={paciente.activo ? 'Suspender paciente' : 'Reactivar paciente'}
                              aria-haspopup="dialog"
                            >
                              {paciente.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && pacientes.length > 0 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface/30">
              <p className="text-sm text-foreground/60">
                Mostrando página <span className="font-medium text-foreground">{page + 1}</span> de <span className="font-medium text-foreground">{totalPages || 1}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={isFirst}
                  className="p-2 rounded-xl border border-border text-foreground hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min((totalPages || 1) - 1, p + 1))}
                  disabled={isLast}
                  className="p-2 rounded-xl border border-border text-foreground hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación */}
      {modalPaciente && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCloseModal();
            }
          }}
        >
          <div
            className="bg-surface border border-border shadow-2xl rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              modalPaciente.activo ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
            }`}>
              {modalPaciente.activo ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h2 id="modal-title" className="text-xl font-bold text-foreground mb-2">
              {modalPaciente.activo ? 'Suspender' : 'Reactivar'} paciente
            </h2>
            <p className="text-foreground/70 mb-4">
              ¿Estás seguro de que deseas {modalPaciente.activo ? 'suspender' : 'reactivar'} al paciente <span className="font-semibold">{modalPaciente.nombre}</span>?
            </p>

            {estadoError && (
              <div className="mb-6 p-3 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{estadoError}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl font-medium border border-border hover:bg-surface/70 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={estadoMutation.isPending}
              >
                Cancelar
              </button>
              <button
                autoFocus
                onClick={() => estadoMutation.mutate({ id: modalPaciente.id, activo: !modalPaciente.activo })}
                disabled={estadoMutation.isPending}
                className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary ${
                  modalPaciente.activo
                    ? 'bg-error hover:bg-error/90 text-error-foreground'
                    : 'bg-success hover:bg-success/90 text-success-foreground'
                }`}
              >
                {estadoMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                )}
                {modalPaciente.activo ? 'Sí, suspender' : 'Sí, reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
