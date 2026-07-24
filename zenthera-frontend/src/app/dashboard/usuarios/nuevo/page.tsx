'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UsuarioCreateSchema, UsuarioCreateFormData } from '@/lib/validations/usuarios.schema';
import { createUsuario, getRolesAsignables } from '@/lib/api/usuarios';
import { Users, ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['rolesAsignables'],
    queryFn: getRolesAsignables,
  });

  const roles = rolesData?.data || [];

  const { register, handleSubmit, formState: { errors } } = useForm<UsuarioCreateFormData>({
    resolver: zodResolver(UsuarioCreateSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      cedula: '',
      correo: '',
      telefono: '',
      password: '',
      foto: ''
    }
  });

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      router.push('/dashboard/usuarios');
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || error.message || 'Ocurrió un error al crear el usuario.');
    }
  });

  const onSubmit = (data: UsuarioCreateFormData) => {
    setSubmitError(null);
    createMutation.mutate(data);
  };

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA']}>
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard/usuarios" className="inline-flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2 py-1 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a usuarios
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Nuevo Usuario
            </h1>
            <p className="text-foreground/60">
              Registra un nuevo médico, recepcionista o personal para tu clínica.
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
            <p className="text-sm font-medium">Usuario creado exitosamente. Redirigiendo...</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
          <section className="glass rounded-2xl p-6 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2">
                <label htmlFor="rolId" className="block text-sm font-medium text-foreground/90 mb-1">Rol *</label>
                <div className="relative">
                  <select
                    id="rolId"
                    {...register('rolId', { valueAsNumber: true })}
                    className={`w-full bg-surface/50 border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary transition-shadow appearance-none ${errors.rolId ? 'border-error' : 'border-border'}`}
                    disabled={isLoadingRoles}
                  >
                    <option value="">Seleccione un rol...</option>
                    {roles.map(rol => (
                      <option key={rol.id} value={rol.id}>{rol.nombre.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isLoadingRoles && <Loader2 className="w-4 h-4 animate-spin text-foreground/40" />}
                  </div>
                </div>
                {errors.rolId && <p className="mt-1 text-sm text-error">{errors.rolId.message}</p>}
              </div>

              <div>
                <label htmlFor="nombres" className="block text-sm font-medium text-foreground/90 mb-1">Nombres *</label>
                <input
                  id="nombres"
                  type="text"
                  {...register('nombres')}
                  className={`w-full bg-surface/50 border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary transition-shadow ${errors.nombres ? 'border-error' : 'border-border'}`}
                  placeholder="Juan Carlos"
                />
                {errors.nombres && <p className="mt-1 text-sm text-error">{errors.nombres.message}</p>}
              </div>

              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-foreground/90 mb-1">Apellidos *</label>
                <input
                  id="apellidos"
                  type="text"
                  {...register('apellidos')}
                  className={`w-full bg-surface/50 border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary transition-shadow ${errors.apellidos ? 'border-error' : 'border-border'}`}
                  placeholder="Pérez López"
                />
                {errors.apellidos && <p className="mt-1 text-sm text-error">{errors.apellidos.message}</p>}
              </div>

              <div>
                <label htmlFor="cedula" className="block text-sm font-medium text-foreground/90 mb-1">Cédula *</label>
                <input
                  id="cedula"
                  type="text"
                  {...register('cedula')}
                  className={`w-full bg-surface/50 border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary transition-shadow ${errors.cedula ? 'border-error' : 'border-border'}`}
                  placeholder="1700000000"
                />
                {errors.cedula && <p className="mt-1 text-sm text-error">{errors.cedula.message}</p>}
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-foreground/90 mb-1">Teléfono</label>
                <input
                  id="telefono"
                  type="text"
                  {...register('telefono')}
                  className={`w-full bg-surface/50 border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary transition-shadow ${errors.telefono ? 'border-error' : 'border-border'}`}
                  placeholder="0999999999"
                />
                {errors.telefono && <p className="mt-1 text-sm text-error">{errors.telefono.message}</p>}
              </div>

              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-foreground/90 mb-1">Correo Electrónico *</label>
                <input
                  id="correo"
                  type="email"
                  {...register('correo')}
                  className={`w-full bg-surface/50 border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary transition-shadow ${errors.correo ? 'border-error' : 'border-border'}`}
                  placeholder="juan@ejemplo.com"
                />
                {errors.correo && <p className="mt-1 text-sm text-error">{errors.correo.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground/90 mb-1">Contraseña provisional *</label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className={`w-full bg-surface/50 border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:border-transparent focus:ring-primary transition-shadow ${errors.password ? 'border-error' : 'border-border'}`}
                  placeholder="Min 8 chars, 1 Mayus, 1 Num, 1 Especial"
                />
                {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || createMutation.isSuccess}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {createMutation.isPending ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
