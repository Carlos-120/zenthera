'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsuarioUpdateSchema, UsuarioUpdateFormData } from '@/lib/validations/usuarios.schema';
import { getUsuarioById, updateUsuario, getRolesAsignables } from '@/lib/api/usuarios';
import { Users, ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: usuarioData, isLoading: isLoadingUsuario, isError: isErrorUsuario } = useQuery({
    queryKey: ['usuario', id],
    queryFn: () => getUsuarioById(id),
    enabled: !!id,
  });

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['rolesAsignables'],
    queryFn: getRolesAsignables,
  });

  const usuario = usuarioData?.data;
  const roles = rolesData?.data || [];

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UsuarioUpdateFormData>({
    resolver: zodResolver(UsuarioUpdateSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      cedula: '',
      correo: '',
      telefono: '',
      foto: ''
    }
  });

  useEffect(() => {
    if (usuario) {
      reset({
        rolId: usuario.rolId,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        cedula: usuario.cedula,
        correo: usuario.correo,
        telefono: usuario.telefono || '',
        foto: usuario.foto || ''
      });
    }
  }, [usuario, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UsuarioUpdateFormData) => updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuario', id] });
      router.push('/dashboard/usuarios');
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || error.message || 'Ocurrió un error al actualizar el usuario.');
    }
  });

  const onSubmit = (data: UsuarioUpdateFormData) => {
    setSubmitError(null);
    updateMutation.mutate(data);
  };

  if (isLoadingUsuario) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isErrorUsuario || !usuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Usuario no encontrado</h3>
        <p className="text-foreground/60 text-sm mb-4">
          El usuario que intentas editar no existe o no tienes permisos para verlo.
        </p>
        <Link href="/dashboard/usuarios" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
          Volver a usuarios
        </Link>
      </div>
    );
  }

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
              Editar Usuario
            </h1>
            <p className="text-foreground/60">
              Modifica los datos del usuario {usuario.nombres} {usuario.apellidos}.
            </p>
          </div>
        </header>

        {submitError && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{submitError}</p>
          </div>
        )}

        {updateMutation.isSuccess && (
          <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success flex items-start gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">Usuario actualizado exitosamente. Redirigiendo...</p>
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
                />
                {errors.correo && <p className="mt-1 text-sm text-error">{errors.correo.message}</p>}
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending || updateMutation.isSuccess}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
