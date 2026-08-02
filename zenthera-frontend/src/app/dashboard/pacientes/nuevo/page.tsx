'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PacienteRequestSchema, PacienteFormValues } from '@/lib/validations/pacientes.schema';
import { createPaciente } from '@/lib/api/pacientes';
import { AlertCircle, ArrowLeft, Loader2, Save, UserSquare2 } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function NuevoPacientePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(PacienteRequestSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      cedula: '',
      fechaNacimiento: '',
      sexo: 'FEMENINO',
      telefono: '',
      correo: '',
      direccion: '',
      tipoSangre: '',
      alergias: '',
      contactoEmergencia: '',
      telefonoEmergencia: '',
    }
  });

  const mutation = useMutation({
    mutationFn: createPaciente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      sessionStorage.setItem('paciente_creado', 'true');
      router.push('/dashboard/pacientes');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setServerError(err.response?.data?.message || 'Error al crear el paciente');
    }
  });

  const onSubmit = (data: PacienteFormValues) => {
    setServerError(null);
    mutation.mutate(data);
  };

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA', 'MEDICO', 'RECEPCIONISTA']}>
      <div className="max-w-4xl mx-auto pb-10 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard/pacientes" className="inline-flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2 py-1 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a pacientes
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <UserSquare2 className="w-8 h-8 text-primary" />
              Nuevo Paciente
            </h1>
            <p className="text-foreground/60 text-sm">
              Ingresa los datos para registrar un nuevo paciente en la clínica.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
          <section className="glass rounded-2xl p-6 md:p-8 border border-border">
            {serverError && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error al guardar</p>
                  <p className="text-sm mt-1 opacity-90">{serverError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-2">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Información Personal</h2>
              </div>

              {/* Nombres */}
              <div className="space-y-1.5">
                <label htmlFor="nombres" className="block text-sm font-medium text-foreground/80">
                  Nombres <span className="text-error">*</span>
                </label>
                <input
                  id="nombres"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.nombres ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. Juan Carlos"
                  {...register('nombres')}
                />
                {errors.nombres && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.nombres.message}</p>}
              </div>

              {/* Apellidos */}
              <div className="space-y-1.5">
                <label htmlFor="apellidos" className="block text-sm font-medium text-foreground/80">
                  Apellidos <span className="text-error">*</span>
                </label>
                <input
                  id="apellidos"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.apellidos ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. Pérez Silva"
                  {...register('apellidos')}
                />
                {errors.apellidos && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.apellidos.message}</p>}
              </div>

              {/* Cédula */}
              <div className="space-y-1.5">
                <label htmlFor="cedula" className="block text-sm font-medium text-foreground/80">
                  Cédula / Identificación <span className="text-error">*</span>
                </label>
                <input
                  id="cedula"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.cedula ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. 1234567890"
                  {...register('cedula')}
                />
                {errors.cedula && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.cedula.message}</p>}
              </div>

              {/* Fecha de Nacimiento */}
              <div className="space-y-1.5">
                <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-foreground/80">
                  Fecha de Nacimiento <span className="text-error">*</span>
                </label>
                <input
                  id="fechaNacimiento"
                  type="date"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.fechaNacimiento ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('fechaNacimiento')}
                />
                {errors.fechaNacimiento && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.fechaNacimiento.message}</p>}
              </div>

              {/* Sexo */}
              <div className="space-y-1.5">
                <label htmlFor="sexo" className="block text-sm font-medium text-foreground/80">
                  Sexo <span className="text-error">*</span>
                </label>
                <select
                  id="sexo"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.sexo ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('sexo')}
                >
                  <option value="FEMENINO">Femenino</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="OTRO">Otro</option>
                </select>
                {errors.sexo && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.sexo.message}</p>}
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label htmlFor="telefono" className="block text-sm font-medium text-foreground/80">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  type="tel"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.telefono ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. 0999999999"
                  {...register('telefono')}
                />
                {errors.telefono && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.telefono.message}</p>}
              </div>

              {/* Correo */}
              <div className="space-y-1.5">
                <label htmlFor="correo" className="block text-sm font-medium text-foreground/80">
                  Correo Electrónico
                </label>
                <input
                  id="correo"
                  type="email"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.correo ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="ejemplo@correo.com"
                  {...register('correo')}
                />
                {errors.correo && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.correo.message}</p>}
              </div>

              {/* Dirección */}
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="direccion" className="block text-sm font-medium text-foreground/80">
                  Dirección
                </label>
                <input
                  id="direccion"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.direccion ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. Av. Principal 123 y Calle Secundaria"
                  {...register('direccion')}
                />
                {errors.direccion && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.direccion.message}</p>}
              </div>

              {/* Separador */}
              <div className="space-y-4 md:col-span-2 mt-4">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Información Médica y Emergencias</h2>
              </div>

              {/* Tipo de Sangre */}
              <div className="space-y-1.5">
                <label htmlFor="tipoSangre" className="block text-sm font-medium text-foreground/80">
                  Tipo de Sangre
                </label>
                <select
                  id="tipoSangre"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.tipoSangre ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  {...register('tipoSangre')}
                >
                  <option value="">Seleccione...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                {errors.tipoSangre && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.tipoSangre.message}</p>}
              </div>

              {/* Alergias */}
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="alergias" className="block text-sm font-medium text-foreground/80">
                  Alergias (separadas por coma)
                </label>
                <input
                  id="alergias"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.alergias ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. Penicilina, Ibuprofeno"
                  {...register('alergias')}
                />
                {errors.alergias && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.alergias.message}</p>}
              </div>

              {/* Contacto Emergencia */}
              <div className="space-y-1.5">
                <label htmlFor="contactoEmergencia" className="block text-sm font-medium text-foreground/80">
                  Nombre Contacto Emergencia
                </label>
                <input
                  id="contactoEmergencia"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.contactoEmergencia ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. María Pérez (Madre)"
                  {...register('contactoEmergencia')}
                />
                {errors.contactoEmergencia && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.contactoEmergencia.message}</p>}
              </div>

              {/* Teléfono Emergencia */}
              <div className="space-y-1.5">
                <label htmlFor="telefonoEmergencia" className="block text-sm font-medium text-foreground/80">
                  Teléfono de Emergencia
                </label>
                <input
                  id="telefonoEmergencia"
                  type="tel"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.telefonoEmergencia ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Ej. 0988888888"
                  {...register('telefonoEmergencia')}
                />
                {errors.telefonoEmergencia && <p className="text-xs text-error mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.telefonoEmergencia.message}</p>}
              </div>

            </div>

            <div className="pt-6 border-t border-border flex flex-col-reverse md:flex-row items-center justify-end gap-3">
              <Link
                href="/dashboard/pacientes"
                className="w-full md:w-auto px-6 py-2.5 rounded-xl font-medium border border-border hover:bg-surface/70 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                {isSubmitting || mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Crear Paciente
                  </>
                )}
              </button>
            </div>
          </section>
        </form>
      </div>
    </RoleGuard>
  );
}
