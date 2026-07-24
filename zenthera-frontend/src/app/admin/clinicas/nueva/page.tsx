'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClinicaCreateSchema, ClinicaCreateInput } from '@/lib/validations/clinicas.schema';
import { createClinica } from '@/lib/api/clinicas';
import { Building2, UserCircle, ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function NuevaClinicaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ClinicaCreateInput>({
    resolver: zodResolver(ClinicaCreateSchema),
    defaultValues: {
      ruc: '',
      razonSocial: '',
      nombre: '',
      correo: '',
      telefono: '',
      adminNombres: '',
      adminApellidos: '',
      adminCedula: '',
      adminCorreo: '',
    }
  });

  const createMutation = useMutation({
    mutationFn: createClinica,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicas'] });
      router.push('/admin/clinicas');
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || error.message || 'Ocurrió un error al crear la clínica.');
    }
  });

  const onSubmit = (data: ClinicaCreateInput) => {
    setSubmitError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/admin/clinicas" className="inline-flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a clínicas
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            Registrar Nueva Clínica
          </h1>
          <p className="text-foreground/60">
            Ingresa los datos para registrar una nueva clínica en el sistema.
          </p>
        </div>
      </header>

      {submitError && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      )}

      {createMutation.isSuccess && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Clínica creada exitosamente. Redirigiendo...</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
        {/* Datos de la Clínica */}
        <section className="glass rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Datos de la Clínica</h2>
              <p className="text-sm text-foreground/60">Información principal del establecimiento</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="ruc" className="block text-sm font-medium text-foreground/90 mb-1">RUC *</label>
              <input
                id="ruc"
                type="text"
                {...register('ruc')}
                className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.ruc ? 'border-error' : 'border-border'}`}
                placeholder="1790000000001"
              />
              {errors.ruc && <p className="mt-1 text-sm text-error">{errors.ruc.message}</p>}
            </div>

            <div>
              <label htmlFor="razonSocial" className="block text-sm font-medium text-foreground/90 mb-1">Razón Social *</label>
              <input
                id="razonSocial"
                type="text"
                {...register('razonSocial')}
                className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.razonSocial ? 'border-error' : 'border-border'}`}
                placeholder="Empresa Médica S.A."
              />
              {errors.razonSocial && <p className="mt-1 text-sm text-error">{errors.razonSocial.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="nombre" className="block text-sm font-medium text-foreground/90 mb-1">Nombre Comercial *</label>
              <input
                id="nombre"
                type="text"
                {...register('nombre')}
                className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.nombre ? 'border-error' : 'border-border'}`}
                placeholder="Clínica Zenthera"
              />
              {errors.nombre && <p className="mt-1 text-sm text-error">{errors.nombre.message}</p>}
            </div>

            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-foreground/90 mb-1">Correo de Contacto *</label>
              <input
                id="correo"
                type="email"
                {...register('correo')}
                className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.correo ? 'border-error' : 'border-border'}`}
                placeholder="contacto@clinica.com"
              />
              {errors.correo && <p className="mt-1 text-sm text-error">{errors.correo.message}</p>}
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-foreground/90 mb-1">Teléfono Principal *</label>
              <input
                id="telefono"
                type="text"
                {...register('telefono')}
                className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.telefono ? 'border-error' : 'border-border'}`}
                placeholder="022000000"
              />
              {errors.telefono && <p className="mt-1 text-sm text-error">{errors.telefono.message}</p>}
            </div>
          </div>
        </section>

        {/* Datos del Administrador */}
        <section className="glass rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <div className="p-2 bg-success/10 text-success rounded-lg border border-success/20">
              <UserCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Administrador Principal</h2>
              <p className="text-sm text-foreground/60">Credenciales del administrador inicial (Tenant Admin)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="adminNombres" className="block text-sm font-medium text-foreground/90 mb-1">Nombres *</label>
              <input
                id="adminNombres"
                type="text"
                {...register('adminNombres')}
                className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.adminNombres ? 'border-error' : 'border-border'}`}
                placeholder="Juan Carlos"
              />
              {errors.adminNombres && <p className="mt-1 text-sm text-error">{errors.adminNombres.message}</p>}
            </div>

            <div>
              <label htmlFor="adminApellidos" className="block text-sm font-medium text-foreground/90 mb-1">Apellidos *</label>
              <input
                id="adminApellidos"
                type="text"
                {...register('adminApellidos')}
                className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.adminApellidos ? 'border-error' : 'border-border'}`}
                placeholder="Pérez López"
              />
              {errors.adminApellidos && <p className="mt-1 text-sm text-error">{errors.adminApellidos.message}</p>}
            </div>

            <div>
              <label htmlFor="adminCedula" className="block text-sm font-medium text-foreground/90 mb-1">Cédula / Identificación *</label>
              <input
                id="adminCedula"
                type="text"
                {...register('adminCedula')}
                className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.adminCedula ? 'border-error' : 'border-border'}`}
                placeholder="1700000000"
              />
              {errors.adminCedula && <p className="mt-1 text-sm text-error">{errors.adminCedula.message}</p>}
            </div>

            <div>
              <label htmlFor="adminCorreo" className="block text-sm font-medium text-foreground/90 mb-1">Correo Electrónico *</label>
              <input
                id="adminCorreo"
                type="email"
                {...register('adminCorreo')}
                className={`w-full bg-background border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow ${errors.adminCorreo ? 'border-error' : 'border-border'}`}
                placeholder="juan@ejemplo.com"
              />
              {errors.adminCorreo && <p className="mt-1 text-sm text-error">{errors.adminCorreo.message}</p>}
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending || createMutation.isSuccess}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {createMutation.isPending ? 'Guardando...' : 'Crear Clínica'}
          </button>
        </div>
      </form>
    </div>
  );
}
