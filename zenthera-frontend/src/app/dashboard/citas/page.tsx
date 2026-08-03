'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCitas, EstadoCita } from '@/lib/api/citas';
import { getMedicos } from '@/lib/api/medicos';
import { Calendar, AlertCircle, ChevronLeft, ChevronRight, Filter, Plus, CalendarClock, Clock, User, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/store/authStore';

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

export default function CitasPage() {
  const [currentDate, setCurrentDate] = useState(() => getStartOfWeek(new Date()));
  const [medicoId, setMedicoId] = useState<number | ''>('');
  const [estado, setEstado] = useState<EstadoCita | ''>('');

  const { usuario } = useAuthStore();
  const isMedico = usuario?.rol === 'MEDICO';

  const fechaDesde = getStartOfWeek(currentDate);
  const fechaHasta = new Date(fechaDesde);
  fechaHasta.setDate(fechaDesde.getDate() + 6);
  fechaHasta.setHours(23, 59, 59, 999);

  // Fetch Citas
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['citas', 'agenda', medicoId, estado, fechaDesde.toISOString(), fechaHasta.toISOString()],
    queryFn: () => getCitas({
      page: 0,
      size: 50,
      medicoId: isMedico ? undefined : (medicoId ? Number(medicoId) : undefined),
      estado: estado as EstadoCita || undefined,
      fechaDesde: fechaDesde.toISOString(),
      fechaHasta: fechaHasta.toISOString(),
      sort: 'fechaHoraInicio',
      direction: 'asc'
    }),
    placeholderData: (prev) => prev,
  });

  const { data: medicosData } = useQuery({
    queryKey: ['medicos-options'],
    queryFn: () => getMedicos({ page: 0, size: 50, activo: true }),
    enabled: !isMedico
  });

  const citas = useMemo(() => data?.data?.content || [], [data]);

  const handleNextWeek = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
  };

  const handlePrevWeek = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  };

  const handleToday = () => {
    setCurrentDate(getStartOfWeek(new Date()));
  };

  const clearFilters = () => {
    if (!isMedico) setMedicoId('');
    setEstado('');
    handleToday();
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

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // Group by day
  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(fechaDesde);
      d.setDate(fechaDesde.getDate() + i);
      const dayStr = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
      const dayCitas = citas.filter(c => new Date(c.fechaHoraInicio).toDateString() === d.toDateString());
      return { date: d, label: capitalize(dayStr), citas: dayCitas };
    });
  }, [fechaDesde, citas]);

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA', 'MEDICO', 'RECEPCIONISTA']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <CalendarClock className="w-8 h-8 text-primary" />
              Agenda de Citas
            </h1>
            <p className="text-foreground/60">
              Visualiza y administra la agenda semanal de pacientes.
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
        <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 border border-border items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl border border-border text-foreground hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium bg-surface text-foreground hover:bg-surface/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Hoy
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl border border-border text-foreground hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="hidden md:inline-block ml-4 text-sm font-medium text-foreground/80">
              {fechaDesde.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {fechaHasta.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
            {!isMedico && (
              <select
                value={medicoId}
                onChange={(e) => setMedicoId(e.target.value ? Number(e.target.value) : '')}
                className="block w-full md:w-auto px-4 py-2 border border-border rounded-xl bg-surface/50 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
              onChange={(e) => setEstado(e.target.value as EstadoCita | '')}
              className="block w-full md:w-auto px-4 py-2 border border-border rounded-xl bg-surface/50 text-foreground sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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

            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 p-2 rounded-xl border border-border text-foreground hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <span className="md:hidden w-full text-center text-sm font-medium text-foreground/80 mt-2">
              {fechaDesde.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {fechaHasta.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Agenda Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="bg-surface/30 rounded-2xl border border-border p-4 min-h-[300px] flex flex-col gap-3">
                <div className="h-5 w-24 bg-surface animate-pulse rounded mb-2"></div>
                <div className="h-24 bg-surface animate-pulse rounded-xl"></div>
                <div className="h-24 bg-surface animate-pulse rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center border border-border">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Error al cargar la agenda</h3>
            <p className="text-foreground/60 text-sm max-w-sm">
              {error instanceof Error ? error.message : 'No se pudo obtener la agenda de citas. Por favor, inténtalo de nuevo.'}
            </p>
          </div>
        ) : citas.length === 0 ? (
          <div className="glass p-16 rounded-2xl flex flex-col items-center justify-center text-center border border-border">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No hay citas programadas</h3>
            <p className="text-foreground/60 max-w-md">
              No hay citas programadas para este periodo o con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {days.map((day, idx) => {
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <div key={idx} className={`rounded-2xl border ${isToday ? 'border-primary shadow-sm bg-primary/5' : 'border-border bg-surface/30'} flex flex-col overflow-hidden min-h-[400px]`}>
                  <div className={`p-3 text-center border-b ${isToday ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface border-border'} font-medium text-sm`}>
                    {day.label}
                  </div>
                  <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1">
                    {day.citas.length === 0 ? (
                      <div className="text-xs text-center text-foreground/40 mt-4">Sin citas</div>
                    ) : (
                      day.citas.map(cita => (
                        <div key={cita.id} className="flex flex-col bg-surface hover:bg-surface/80 border border-border rounded-xl p-3 shadow-sm transition-all group">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1 text-xs font-semibold text-foreground/90 bg-surface border border-border px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-primary" />
                              {formatTime(cita.fechaHoraInicio)}
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${getEstadoBadge(cita.estado)}`}>
                              {cita.estado}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5 mb-3">
                            <div className="flex gap-1.5 items-start">
                              <User className="w-3.5 h-3.5 text-foreground/50 mt-0.5 shrink-0" />
                              <span className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                                {cita.paciente.nombres} {cita.paciente.apellidos}
                              </span>
                            </div>
                            {!isMedico && (
                              <div className="flex gap-1.5 items-center">
                                <Stethoscope className="w-3.5 h-3.5 text-foreground/50 shrink-0" />
                                <span className="text-xs text-foreground/70 line-clamp-1">
                                  {cita.medico.nombres} {cita.medico.apellidos}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50 justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/dashboard/citas/${cita.id}`}
                              className="text-xs font-medium text-primary hover:underline flex-1 text-center"
                            >
                              Ver
                            </Link>
                            <span className="text-border">|</span>
                            <button disabled className="text-xs font-medium text-foreground/40 cursor-not-allowed flex-1 text-center" title="Próximamente">
                              Editar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
