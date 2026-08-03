'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMedicos, updateMedicoStatus, MedicoResponse } from '@/lib/api/medicos';
import { useDebounce } from '@/hooks/useDebounce';
import { RoleGuard } from '@/components/auth/RoleGuard';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  Stethoscope, 
  Filter, 
  Mail, 
  Phone, 
  Activity,
  UserRoundX,
  AlertCircle
} from 'lucide-react';

export default function MedicosPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [page, setPage] = useState(0);
  const size = 10;

  // Derive API parameter for activo based on filter
  const activoParam = statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE';

  const { data, isLoading, error } = useQuery({
    queryKey: ['medicos', { page, size, search: debouncedSearch, activo: activoParam }],
    queryFn: () => getMedicos({ page, size, search: debouncedSearch, activo: activoParam }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: updateMedicoStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicos'] });
      setActionMessage({ type: 'success', text: 'Estado del médico actualizado.' });
      setTimeout(() => setActionMessage(null), 3000);
    },
    onError: () => {
      setActionMessage({ type: 'error', text: 'Ocurrió un error al actualizar el estado.' });
      setTimeout(() => setActionMessage(null), 3000);
    }
  });

  const handleToggleStatus = (medico: MedicoResponse) => {
    toggleStatusMutation.mutate({ id: medico.id, activo: !medico.activo });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const medicos = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA']}>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <Stethoscope className="w-8 h-8 text-primary" />
              Médicos
            </h1>
            <p className="text-foreground/60">Gestiona los profesionales de la salud de la clínica.</p>
          </div>
          <Link 
            href="/dashboard/medicos/nuevo"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Nuevo Médico
          </Link>
        </header>

        {actionMessage && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            actionMessage.type === 'success' 
              ? 'bg-success/10 border-success/20 text-success' 
              : 'bg-error/10 border-error/20 text-error'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">{actionMessage.text}</p>
          </div>
        )}

        {/* Filters Section */}
        <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row gap-4 border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, especialidad..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 bg-surface/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-surface/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none transition-all"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass rounded-2xl p-6 h-48 animate-pulse bg-surface/50" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-error/10 border border-error/20 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-error mb-4" />
            <h3 className="text-xl font-bold text-error mb-2">Error al cargar médicos</h3>
            <p className="text-error/80">Por favor, intenta nuevamente más tarde.</p>
          </div>
        ) : medicos.length === 0 ? (
          <div className="glass rounded-2xl p-16 flex flex-col items-center justify-center text-center border border-border">
            <div className="w-20 h-20 bg-surface/50 rounded-full flex items-center justify-center mb-6">
              <UserRoundX className="w-10 h-10 text-foreground/40" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No se encontraron médicos</h3>
            <p className="text-foreground/60 max-w-md">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Intenta ajustar los filtros de búsqueda para ver más resultados.'
                : 'Aún no has registrado ningún médico en la clínica.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicos.map(medico => (
                <div key={medico.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all group flex flex-col relative overflow-hidden">
                  
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${medico.activo ? 'bg-success' : 'bg-foreground/20'}`} />

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {medico.nombres} {medico.apellidos}
                      </h3>
                      <p className="text-sm font-medium text-primary/80 mt-1">{medico.especialidad}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      medico.activo 
                        ? 'bg-success/10 text-success border border-success/20' 
                        : 'bg-foreground/5 text-foreground/60 border border-border'
                    }`}>
                      {medico.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6 flex-1 text-sm text-foreground/70">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-foreground/40" />
                      <span>{medico.cedula}</span>
                    </div>
                    {medico.correo && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-foreground/40" />
                        <span className="truncate">{medico.correo}</span>
                      </div>
                    )}
                    {medico.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-foreground/40" />
                        <span>{medico.telefono}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
                    <button 
                      onClick={() => handleToggleStatus(medico)}
                      disabled={toggleStatusMutation.isPending}
                      className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                        medico.activo 
                          ? 'hover:bg-error/10 text-error' 
                          : 'hover:bg-success/10 text-success'
                      }`}
                    >
                      {medico.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <span className="text-xs text-foreground/40">Detalle Próximamente</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-6">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm font-medium text-foreground/70 min-w-[4rem] text-center">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </RoleGuard>
  );
}
