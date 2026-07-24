'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMiClinica, updateMiClinica, ClinicaUpdateRequest } from '@/lib/api/clinicas';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ClinicaSettingsForm } from '@/components/clinica/ClinicaSettingsForm';
import { Settings, AlertTriangle } from 'lucide-react';
import { AxiosError } from 'axios';

export default function MiClinicaPage() {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['mi-clinica'],
    queryFn: getMiClinica,
    retry: 1
  });

  const updateMutation = useMutation({
    mutationFn: updateMiClinica,
    onSuccess: () => {
      setSubmitError(null);
      // Refrescar los datos luego de guardar
      queryClient.invalidateQueries({ queryKey: ['mi-clinica'] });
      // Opcional: mostrar tostada de éxito
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Ocurrió un error al guardar la configuración de la clínica.';
      setSubmitError(message);
    }
  });

  const handleSubmit = (data: ClinicaUpdateRequest) => {
    // Normalizar strings vacíos a undefined para propiedades opcionales si es necesario,
    // pero el form maneja strings vacíos. El DTO de backend permite nulos u omitir.
    updateMutation.mutate(data);
  };

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA']}>
      <div className="max-w-5xl mx-auto pb-10">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Clínica</h1>
          </div>
          <p className="text-foreground/60 text-lg ml-1">
            Administra la información comercial, de contacto y configuración regional de tu institución.
          </p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 glass rounded-2xl animate-pulse-slow">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-foreground/60">Cargando información de la clínica...</p>
          </div>
        ) : isError || !response?.data ? (
          <div className="p-8 rounded-2xl bg-error/10 border border-error/20 flex flex-col items-center text-center">
            <AlertTriangle className="w-12 h-12 text-error mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Error al cargar datos</h2>
            <p className="text-foreground/70 mb-6">No pudimos obtener la configuración de tu clínica. Por favor, intenta de nuevo.</p>
            <button
              onClick={() => refetch()}
              className="bg-error text-white px-6 py-2 rounded-lg font-medium hover:bg-error/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <ClinicaSettingsForm
            initialData={response.data}
            onSubmit={handleSubmit}
            isPending={updateMutation.isPending}
            error={submitError}
          />
        )}
      </div>
    </RoleGuard>
  );
}
