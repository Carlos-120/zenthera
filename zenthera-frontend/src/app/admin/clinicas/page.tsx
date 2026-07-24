'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllClinicas } from '@/lib/api/clinicas';
import { Building, Search, Activity, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ClinicasPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['clinicas', page, size, searchTerm],
    queryFn: () => getAllClinicas({ page, size, search: searchTerm || undefined }),
    placeholderData: (prev) => prev, // Keeps previous data while fetching new one for smooth pagination
  });

  const clinicas = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;
  const isLast = data?.data?.last ?? true;
  const isFirst = data?.data?.first ?? true;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page on search
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <Building className="w-8 h-8 text-primary" />
            Gestión de Clínicas
          </h1>
          <p className="text-foreground/60">
            Administra todas las clínicas registradas en Zenthera.
          </p>
        </div>

        <Link
          href="/admin/clinicas/nueva"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          Nueva Clínica
        </Link>
      </header>

      {/* Toolbar */}
      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-foreground/40" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl leading-5 bg-surface/50 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
            placeholder="Buscar por nombre o RUC..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Content */}
      <div className="glass rounded-2xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/50 border-b border-border text-foreground/70 text-sm font-medium">
                <th className="py-4 px-6">Clínica</th>
                <th className="py-4 px-6">RUC</th>
                <th className="py-4 px-6">Ubicación</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-surface animate-pulse rounded" />
                          <div className="h-3 w-24 bg-surface animate-pulse rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><div className="h-4 w-24 bg-surface animate-pulse rounded" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-28 bg-surface animate-pulse rounded" /></td>
                    <td className="py-4 px-6"><div className="h-6 w-20 bg-surface animate-pulse rounded-full" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-8 w-8 ml-auto bg-surface animate-pulse rounded-lg" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-1">Error al cargar clínicas</h3>
                      <p className="text-foreground/60 text-sm max-w-sm">
                        {error instanceof Error ? error.message : 'No se pudo obtener la lista de clínicas. Por favor, inténtalo de nuevo.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : clinicas.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={5} className="py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                        <Building className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">No hay clínicas registradas</h3>
                      <p className="text-foreground/60 max-w-md">
                        Aún no se ha registrado ninguna clínica en la plataforma o no hay resultados para tu búsqueda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                clinicas.map((clinica) => (
                  <tr key={clinica.id} className="border-b border-border/50 hover:bg-surface/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                          {clinica.logo ? (
                            <img src={clinica.logo} alt={clinica.nombre} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Building className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">{clinica.nombre}</p>
                          <p className="text-sm text-foreground/60">{clinica.razonSocial}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-foreground/80">{clinica.ruc}</td>
                    <td className="py-4 px-6 text-foreground/80">{clinica.ciudad || 'No especificada'}</td>
                    <td className="py-4 px-6">
                      {clinica.activa ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20">
                          <XCircle className="w-3.5 h-3.5" />
                          Suspendida
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/clinicas/${clinica.id}`}
                        className="p-2 inline-flex text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Activity className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && clinicas.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface/30">
            <p className="text-sm text-foreground/60">
              Mostrando página <span className="font-medium text-foreground">{page + 1}</span> de <span className="font-medium text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={isFirst}
                className="p-2 rounded-lg border border-border text-foreground hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={isLast}
                className="p-2 rounded-lg border border-border text-foreground hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
