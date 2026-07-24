'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCitas, EstadoCita } from '@/lib/api/citas';
import { getPacientes } from '@/lib/api/pacientes';
import { getMedicos } from '@/lib/api/medicos';
import { Calendar, Search, AlertCircle, ChevronLeft, ChevronRight, Filter, ArrowUpDown, Plus, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/store/authStore';

export default function CitasPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [pacienteId, setPacienteId] = useState<number | ''>('');
  const [medicoId, setMedicoId] = useState<number | ''>('');
  const [estado, setEstado] = useState<EstadoCita | ''>('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [sortField, setSortField] = useState<string>('fechaHoraInicio');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { usuario } = useAuthStore();
  const isMedico = usuario?.rol === 'MEDICO';

  const sortParam = `${sortField},${sortDirection}`;

  // Fetch Citas
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['citas', page, size, searchTerm, pacienteId, medicoId, estado, fechaDesde, fechaHasta, sortParam],
    queryFn: () => getCitas({
      page,
      size,
      search: searchTerm || undefined,
      pacienteId: pacienteId ? Number(pacienteId) : undefined,
      medicoId: isMedico ? undefined : (medicoId ? Number(medicoId) : undefined), // Force undefined if MEDICO, backend uses token
      estado: estado as EstadoCita || undefined,
      fechaDesde: fechaDesde ? new Date(fechaDesde).toISOString() : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta).toISOString() : undefined,
      sort: sortField,
      direction: sortDirection
    }),
    placeholderData: (prev) => prev,
  });

  // Fetch options for filters (first 50 for MVP)
  const { data: pacientesData } = useQuery({
    queryKey: ['pacientes-options'],
    queryFn: () => getPacientes({ page: 0, size: 50, activo: true })
  });

  const { data: medicosData } = useQuery({
    queryKey: ['medicos-options'],
    queryFn: () => getMedicos({ page: 0, size: 50, activo: true }),
    enabled: !isMedico
  });

  const citas = data?.data?.content || [];
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

  const clearFilters = () => {
    setSearchTerm('');
    setPacienteId('');
    if (!isMedico) setMedicoId('');
    setEstado('');
    setFechaDesde('');
    setFechaHasta('');
    setPage(0);
  };

  const formatFechaHora = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estadoCita: EstadoCita) => {
    const badges: Record<EstadoCita, string> = {
      'PROGRAMADA': 'bg-blue-100 text-blue-800 border-blue-200',
      'CONFIRMADA': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'EN_ATENCION': 'bg-amber-100 text-amber-800 border-amber-200',
      'COMPLETADA': 'bg-success/10 text-success border-success/20',
      'CANCELADA': 'bg-error/10 text-error border-error/20',
      'NO_ASISTIO': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return badges[estadoCita] || 'bg-surface text-foreground';
  };

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA', 'MEDICO', 'RECEPCIONISTA']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <CalendarClock className="w-8 h-8 text-primary" />
              Gestión de Citas
            </h1>
            <p className="text-foreground/60">
              Administra las citas médicas, horarios y estados de atención.
            </p>
          </div>
          <div>
            <Link
              href="/dashboard/citas/nuevo"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
              title="Ir a crear cita (FRONT-CITAS-002)"
            >
              <Plus className="w-5 h-5" />
              Nueva Cita
            </Link>
          </div>
        </header>

        {/* Filters Toolbar */}
        <div className="glass p-4 rounded-2xl flex flex-col gap-4 border border-border">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-foreground/40" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 border border-border rounded-xl leading-5 bg-surface/50 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-colors"
                placeholder="Buscar por motivo..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-2/3">
              <select
                value={pacienteId}
                onChange={(e) => { setPacienteId(e.target.value ? Number(e.target.value) : ''); setPage(0); }}
                className="block w-full md:w-auto px-4 py-2.5 border border-border rounded-xl bg-surface/50 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Filtro Paciente"
              >
                <option value="">Todos los pacientes</option>
                {pacientesData?.data?.content?.map(p => (
                  <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
                ))}
              </select>

              {!isMedico && (
                <select
                  value={medicoId}
                  onChange={(e) => { setMedicoId(e.target.value ? Number(e.target.value) : ''); setPage(0); }}
                  className="block w-full md:w-auto px-4 py-2.5 border border-border rounded-xl bg-surface/50 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Filtro Médico"
                >
                  <option value="">Todos los médicos</option>
                  {medicosData?.data?.content?.map(m => (
                    <option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>
                  ))}
                </select>
              )}

              <select
                value={estado}
                onChange={(e) => { setEstado(e.target.value as EstadoCita | ''); setPage(0); }}
                className="block w-full md:w-auto px-4 py-2.5 border border-border rounded-xl bg-surface/50 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Filtro Estado"
              >
                <option value="">Todos los estados</option>
                <option value="PROGRAMADA">PROGRAMADA</option>
                <option value="CONFIRMADA">CONFIRMADA</option>
                <option value="EN_ATENCION">EN_ATENCION</option>
                <option value="COMPLETADA">COMPLETADA</option>
                <option value="CANCELADA">CANCELADA</option>
                <option value="NO_ASISTIO">NO_ASISTIO</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
             <div className="flex items-center gap-2 w-full md:w-auto">
                <label htmlFor="fechaDesde" className="text-sm text-foreground/70 font-medium whitespace-nowrap">Desde:</label>
                <input
                  id="fechaDesde"
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => { setFechaDesde(e.target.value); setPage(0); }}
                  className="block w-full px-4 py-2 border border-border rounded-xl bg-surface/50 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
             </div>
             <div className="flex items-center gap-2 w-full md:w-auto">
                <label htmlFor="fechaHasta" className="text-sm text-foreground/70 font-medium whitespace-nowrap">Hasta:</label>
                <input
                  id="fechaHasta"
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => { setFechaHasta(e.target.value); setPage(0); }}
                  className="block w-full px-4 py-2 border border-border rounded-xl bg-surface/50 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
             </div>

             <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium bg-surface text-foreground hover:bg-surface/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto"
              >
                <Filter className="w-4 h-4" />
                Limpiar
              </button>
          </div>
        </div>

        {/* Content */}
        <div className="glass rounded-2xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]" aria-label="Tabla de Citas">
              <thead>
                <tr className="bg-surface/50 border-b border-border text-foreground/70 text-sm font-medium">
                  <th className="py-4 px-6 text-sm font-medium" aria-sort={sortField === 'fechaHoraInicio' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none"
                      onClick={() => handleSort('fechaHoraInicio')}
                      aria-label="Ordenar por Inicio"
                    >
                      Inicio <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium" aria-sort={sortField === 'fechaHoraFin' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none"
                      onClick={() => handleSort('fechaHoraFin')}
                      aria-label="Ordenar por Fin"
                    >
                      Fin <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium text-foreground/70">Paciente</th>
                  <th className="py-4 px-6 text-sm font-medium text-foreground/70">Médico</th>
                  <th className="py-4 px-6 text-sm font-medium" aria-sort={sortField === 'estado' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none"
                      onClick={() => handleSort('estado')}
                      aria-label="Ordenar por Estado"
                    >
                      Estado <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium text-foreground/70 text-right">Duración</th>
                  <th className="py-4 px-6 text-sm font-medium text-right" aria-sort={sortField === 'createdAt' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      className="flex items-center justify-end gap-1 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded select-none ml-auto"
                      onClick={() => handleSort('createdAt')}
                      aria-label="Ordenar por Registro"
                    >
                      Registro <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-sm font-medium text-right text-foreground/70">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-4 px-6"><div className="h-4 w-32 bg-surface animate-pulse rounded" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-32 bg-surface animate-pulse rounded" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-40 bg-surface animate-pulse rounded" /></td>
                      <td className="py-4 px-6"><div className="h-4 w-40 bg-surface animate-pulse rounded" /></td>
                      <td className="py-4 px-6"><div className="h-6 w-24 bg-surface animate-pulse rounded-full" /></td>
                      <td className="py-4 px-6 text-right"><div className="h-4 w-12 bg-surface animate-pulse rounded ml-auto" /></td>
                      <td className="py-4 px-6 text-right"><div className="h-4 w-20 bg-surface animate-pulse rounded ml-auto" /></td>
                      <td className="py-4 px-6"><div className="h-8 w-16 bg-surface animate-pulse rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={8} className="py-12">
                      <div className="flex flex-col items-center justify-center text-center" role="alert">
                        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">Error al cargar citas</h3>
                        <p className="text-foreground/60 text-sm max-w-sm">
                          {error instanceof Error ? error.message : 'No se pudo obtener la lista de citas. Por favor, inténtalo de nuevo.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : citas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                          <Calendar className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No se encontraron citas</h3>
                        <p className="text-foreground/60 max-w-md">
                          No hay registros que coincidan con tu búsqueda o filtros actuales.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  citas.map((cita) => (
                    <tr key={cita.id} className="border-b border-border/50 hover:bg-surface/30 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-foreground/80">
                        {formatFechaHora(cita.fechaHoraInicio)}
                      </td>
                      <td className="py-4 px-6 text-sm text-foreground/80">
                        {formatFechaHora(cita.fechaHoraFin)}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className="font-medium text-foreground">{cita.paciente.nombres} {cita.paciente.apellidos}</span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className="font-medium text-foreground">{cita.medico.nombres} {cita.medico.apellidos}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoBadge(cita.estado)}`}>
                          {cita.estado}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-sm text-foreground/80">
                        {cita.duracionMinutos} min
                      </td>
                      <td className="py-4 px-6 text-right text-sm text-foreground/60">
                        {new Date(cita.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/citas/${cita.id}`}
                            className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                            title="Ver detalles de la cita (FRONT-CITAS-002)"
                          >
                            <Search className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && citas.length > 0 && (
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
    </RoleGuard>
  );
}
