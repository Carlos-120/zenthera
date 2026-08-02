'use client';

import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { CitaListResponse } from '@/lib/api/citas';
import { Users, Calendar, UserPlus, DollarSign, Activity, FileText, ArrowRight, UserRoundPlus, CalendarPlus, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const usuario = useAuthStore((state) => state.usuario);

  // Fecha de hoy para las citas
  const hoy = new Date();
  const inicioDia = new Date(hoy.setHours(0, 0, 0, 0)).toISOString();
  const finDia = new Date(hoy.setHours(23, 59, 59, 999)).toISOString();

  // 1. Fetch Pacientes Totales
  const { data: pacientesData, isLoading: loadingPacientes, isError: errorPacientes } = useQuery({
    queryKey: ['pacientes-count'],
    queryFn: async () => {
      const response = await apiClient.get('/api/pacientes/paginado?size=1');
      return response.data?.data?.totalElements || 0;
    },
    enabled: !!usuario && usuario.rol === 'ADMIN_CLINICA'
  });

  // 2. Fetch Médicos Totales
  const { data: medicosData, isLoading: loadingMedicos, isError: errorMedicos } = useQuery({
    queryKey: ['medicos-count'],
    queryFn: async () => {
      const response = await apiClient.get('/api/medicos/paginado?size=1');
      return response.data?.data?.totalElements || 0;
    },
    enabled: !!usuario && usuario.rol === 'ADMIN_CLINICA'
  });

  // 3. Fetch Citas de Hoy
  const { data: citasData, isLoading: loadingCitas, isError: errorCitas } = useQuery({
    queryKey: ['citas-hoy', inicioDia, finDia],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/clinica/citas?fechaDesde=${inicioDia}&fechaHasta=${finDia}&size=10&sort=fechaHoraInicio&direction=asc`);
      return response.data?.data || { totalElements: 0, content: [] };
    },
    enabled: !!usuario && usuario.rol === 'ADMIN_CLINICA'
  });

  if (!usuario) return null;

  // Si es super admin y está viendo esto (aunque su home principal debería ser Gestión de clínicas)
  if (usuario.rol === 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center">
        <h1 className="text-3xl font-bold mb-2">Bienvenido de nuevo, {usuario.nombres}</h1>
        <p className="text-foreground/60 mb-6">Panel administrativo centralizado</p>
        <Link href="/dashboard/clinicas" className="btn-primary flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
          Ir a Gestión de clínicas
        </Link>
      </div>
    );
  }

  // --- MOCK DE INGRESOS (Solo UI) ---
  const ingresosData = null; // No hay endpoint para ingresos aún
  const loadingIngresos = false;

  const kpis = [
    { label: 'Pacientes registrados', value: loadingPacientes ? '...' : errorPacientes ? 'Error' : pacientesData, icon: <Users className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-500/10' },
    { label: 'Citas de hoy', value: loadingCitas ? '...' : errorCitas ? 'Error' : citasData?.totalElements, icon: <Calendar className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-500/10' },
    { label: 'Médicos activos', value: loadingMedicos ? '...' : errorMedicos ? 'Error' : medicosData, icon: <UserPlus className="w-5 h-5 text-teal-500" />, bg: 'bg-teal-500/10' },
    { label: 'Ingresos del mes', value: loadingIngresos ? '...' : (ingresosData !== null ? ingresosData : 'Sin datos'), icon: <DollarSign className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-1 text-foreground">
          Bienvenido de nuevo, {usuario.nombres}
        </h1>
        <p className="text-foreground/60 text-sm">
          Aquí tienes un resumen de la actividad de tu clínica.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={index} className="glass p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-200">
            <div className={"w-12 h-12 rounded-xl flex items-center justify-center " + kpi.bg}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-foreground">
                {kpi.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Semanal (Gráfico) */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col min-h-[350px]">
          <h2 className="text-lg font-bold mb-6">Actividad semanal</h2>
          <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 text-sm">
            <Activity className="w-12 h-12 mb-3 opacity-20" />
            <p>El Gráfico de actividad semanal se implementará próximamente.</p>
            <p>No hay datos disponibles en este momento.</p>
          </div>
        </div>

        {/* Accesos Rápidos & Actividad Reciente */}
        <div className="space-y-6">
          {/* Accesos Rápidos */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Accesos Rápidos</h2>
            <div className="space-y-3">
              <Link href="/dashboard/pacientes/nuevo" className="flex items-center justify-between p-3 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <UserRoundPlus className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">Registrar paciente</span>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors" />
              </Link>
              <Link href="/dashboard/citas/nuevo" className="flex items-center justify-between p-3 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <CalendarPlus className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">Nueva cita</span>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors" />
              </Link>
              <div className="flex items-center justify-between p-3 rounded-xl opacity-50 cursor-not-allowed border border-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-foreground/60">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">Generar reporte</span>
                </div>
                <span className="text-[10px] uppercase font-bold bg-surface px-2 py-1 rounded">próximamente</span>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="glass rounded-2xl p-6 min-h-[200px] flex flex-col">
            <h2 className="text-lg font-bold mb-4">Actividad reciente</h2>
            <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 text-sm text-center">
              <Clock className="w-8 h-8 mb-2 opacity-20" />
              <p>No hay actividad reciente registrada.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Citas del Día */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold">Citas del Día</h2>
          <Link href="/dashboard/citas" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface/50 text-foreground/60">
              <tr>
                <th className="px-6 py-4 font-medium">Paciente</th>
                <th className="px-6 py-4 font-medium">Médico</th>
                <th className="px-6 py-4 font-medium">Hora</th>
                <th className="px-6 py-4 font-medium">Especialidad</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingCitas ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-foreground/60">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                      Cargando citas...
                    </div>
                  </td>
                </tr>
              ) : errorCitas ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-error">
                    <p>No se pudieron cargar los datos.</p>
                  </td>
                </tr>
              ) : citasData?.content && citasData.content.length > 0 ? (
                citasData.content.map((cita: CitaListResponse) => (
                  <tr key={cita.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{cita.paciente.nombres} {cita.paciente.apellidos}</td>
                    <td className="px-6 py-4">{cita.medico.nombres} {cita.medico.apellidos}</td>
                    <td className="px-6 py-4">
                      {new Date(cita.fechaHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">General</td>
                    <td className="px-6 py-4">
                      <span className={'px-2.5 py-1 rounded-full text-xs font-semibold ' + (
                        cita.estado === 'PROGRAMADA' ? 'bg-blue-500/10 text-blue-500' :
                        cita.estado === 'COMPLETADA' ? 'bg-emerald-500/10 text-emerald-500' :
                        cita.estado === 'CANCELADA' ? 'bg-red-500/10 text-red-500' :
                        'bg-surface text-foreground/60'
                      )}>
                        {cita.estado}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-foreground/50">
                    <Calendar className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No hay citas programadas para hoy</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
