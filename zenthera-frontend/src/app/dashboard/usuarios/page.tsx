'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsuarios, getRolesAsignables, updateEstadoUsuario } from '@/lib/api/usuarios';
import { Users, Search, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Filter, ArrowUpDown, Loader2, Plus, Edit, Power, PowerOff } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function UsuariosPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros adicionales permitidos
  const [activoFiltro, setActivoFiltro] = useState<boolean | undefined>(undefined);
  const [rolFiltro, setRolFiltro] = useState<number | undefined>(undefined);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortParam = `${sortField},${sortDirection}`;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['usuarios', page, size, searchTerm, activoFiltro, rolFiltro, sortParam],
    queryFn: () => getUsuarios({
      page,
      size,
      search: searchTerm || undefined,
      activo: activoFiltro,
      rolId: rolFiltro,
      sort: sortParam
    }),
    placeholderData: (prev) => prev,
  });

  const { data: rolesData, isLoading: isLoadingRoles, isError: isErrorRoles } = useQuery({
    queryKey: ['rolesAsignables'],
    queryFn: getRolesAsignables,
  });

  const usuarios = data?.data?.content || [];
  const roles = rolesData?.data || [];
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

  const queryClient = useQueryClient();
  const [modalUsuario, setModalUsuario] = useState<{ id: number; nombre: string; activo: boolean } | null>(null);
  const [estadoError, setEstadoError] = useState<string | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const estadoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => updateEstadoUsuario(id, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setModalUsuario(null);
      setEstadoError(null);
    },
    onError: (error: any) => {
      setEstadoError(error.response?.data?.message || 'Ocurrió un error al cambiar el estado.');
    }
  });

  const handleOpenModal = (usuario: { id: number; nombre: string; activo: boolean }, target: HTMLButtonElement) => {
    triggerRef.current = target;
    setModalUsuario(usuario);
    setEstadoError(null);
  };

  const handleCloseModal = () => {
    setModalUsuario(null);
    setEstadoError(null);
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Gestión de Usuarios
            </h1>
            <p className="text-foreground/60">
              Administra médicos, recepcionistas y otros usuarios de tu clínica.
            </p>
          </div>
          <div>
            <Link
              href="/dashboard/usuarios/nuevo"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              Nuevo Usuario
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
              placeholder="Buscar por nombres, correo o cédula..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <select
                className="border border-border rounded-xl bg-surface/50 text-sm py-2.5 pl-4 pr-10 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-primary text-foreground transition-colors cursor-pointer appearance-none w-full sm:w-auto min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
                value={rolFiltro || ''}
                onChange={(e) => {
                  setRolFiltro(e.target.value ? Number(e.target.value) : undefined);
                  setPage(0);
                }}
                aria-label="Filtrar por rol"
                disabled={isLoadingRoles || isErrorRoles}
              >
                <option value="">Todos los roles</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {isLoadingRoles ? (
                  <Loader2 className="w-4 h-4 animate-spin text-foreground/40" />
                ) : isErrorRoles ? (
                  <span title="Error cargando roles"><AlertCircle className="w-4 h-4 text-error" /></span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-foreground/40 rotate-90" />
                )}
              </div>
            </div>
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
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface/50 border-b border-border text-foreground/70 text-sm font-medium">
                  <th className="py-4 px-6 text-sm font-medium" aria-sort={sortField === 'nombres' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none"
                      onClick={() => handleSort('nombres')}
                      aria-label="Ordenar por Usuario"
                    >
                      Usuario <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium" aria-sort={sortField === 'correo' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none"
                      onClick={() => handleSort('correo')}
                      aria-label="Ordenar por Contacto"
                    >
                      Contacto <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium text-foreground/70">Rol</th>
                  <th className="py-4 px-6 text-sm font-medium" aria-sort={sortField === 'activo' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none"
                      onClick={() => handleSort('activo')}
                      aria-label="Ordenar por Estado"
                    >
                      Estado <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium text-right" aria-sort={sortField === 'createdAt' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center justify-end gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none ml-auto"
                      onClick={() => handleSort('createdAt')}
                      aria-label="Ordenar por Fecha Registro"
                    >
                      Fecha Registro <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium text-right text-foreground/70">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Skeletons
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-surface animate-pulse rounded" />
                            <div className="h-3 w-24 bg-surface animate-pulse rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <div className="h-4 w-40 bg-surface animate-pulse rounded" />
                          <div className="h-3 w-28 bg-surface animate-pulse rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-6"><div className="h-6 w-24 bg-surface animate-pulse rounded-full" /></td>
                      <td className="py-4 px-6"><div className="h-6 w-20 bg-surface animate-pulse rounded-full" /></td>
                      <td className="py-4 px-6 text-right"><div className="h-4 w-24 bg-surface animate-pulse rounded ml-auto" /></td>
                      <td className="py-4 px-6"><div className="h-8 w-16 bg-surface animate-pulse rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">Error al cargar usuarios</h3>
                        <p className="text-foreground/60 text-sm max-w-sm">
                          {error instanceof Error ? error.message : 'No se pudo obtener la lista de usuarios. Por favor, inténtalo de nuevo.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={6} className="py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                          <Users className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No se encontraron usuarios</h3>
                        <p className="text-foreground/60 max-w-md">
                          No hay registros que coincidan con tu búsqueda o filtros actuales.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-border/50 hover:bg-surface/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 overflow-hidden">
                            {usuario.foto ? (
                              <img src={usuario.foto} alt={`${usuario.nombres} ${usuario.apellidos}`} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-sm">{usuario.nombres.charAt(0)}{usuario.apellidos.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">{usuario.nombres} {usuario.apellidos}</p>
                            <p className="text-xs text-foreground/50">C.I. {usuario.cedula}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-foreground/80">{usuario.correo}</p>
                        <p className="text-xs text-foreground/50">{usuario.telefono || 'Sin teléfono'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-foreground border border-border">
                          {usuario.nombreRol.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {usuario.activo ? (
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
                        {new Date(usuario.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/usuarios/${usuario.id}`}
                            className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          {usuario.nombreRol !== 'ADMIN_CLINICA' && (
                            <button
                              onClick={(e) => handleOpenModal({ id: usuario.id, nombre: `${usuario.nombres} ${usuario.apellidos}`, activo: usuario.activo }, e.currentTarget)}
                              className={`p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                                usuario.activo
                                  ? 'text-error/70 hover:text-error hover:bg-error/10'
                                  : 'text-success/70 hover:text-success hover:bg-success/10'
                              }`}
                              title={usuario.activo ? 'Suspender usuario' : 'Reactivar usuario'}
                              aria-haspopup="dialog"
                            >
                              {usuario.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
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
          {!isLoading && usuarios.length > 0 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface/30">
              <p className="text-sm text-foreground/60">
                Mostrando página <span className="font-medium text-foreground">{page + 1}</span> de <span className="font-medium text-foreground">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={isFirst}
                  className="p-2 rounded-xl border border-border text-foreground hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={isLast}
                  className="p-2 rounded-xl border border-border text-foreground hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación */}
      {modalUsuario && (
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
              modalUsuario.activo ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
            }`}>
              {modalUsuario.activo ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h2 id="modal-title" className="text-xl font-bold text-foreground mb-2">
              {modalUsuario.activo ? 'Suspender' : 'Reactivar'} usuario
            </h2>
            <p className="text-foreground/70 mb-4">
              ¿Estás seguro de que deseas {modalUsuario.activo ? 'suspender' : 'reactivar'} al usuario <span className="font-semibold">{modalUsuario.nombre}</span>?
              {modalUsuario.activo ? ' No podrá acceder al sistema mientras esté suspendido.' : ' Recuperará su acceso al sistema de forma inmediata.'}
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
                onClick={() => estadoMutation.mutate({ id: modalUsuario.id, activo: !modalUsuario.activo })}
                disabled={estadoMutation.isPending}
                className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary ${
                  modalUsuario.activo
                    ? 'bg-error hover:bg-error/90 text-error-foreground'
                    : 'bg-success hover:bg-success/90 text-success-foreground'
                }`}
              >
                {estadoMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                )}
                {modalUsuario.activo ? 'Sí, suspender' : 'Sí, reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
