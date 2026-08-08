'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PacienteRequestSchema, PacienteFormValues } from '@/lib/validations/pacientes.schema';
import { getPacienteById, updatePaciente } from '@/lib/api/pacientes';
import { AlertCircle, ArrowLeft, Loader2, Save, UserSquare2, RefreshCcw, Edit, Phone, Mail, MapPin, Calendar, Activity, X } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { use } from 'react';

function calcularEdad(fechaNacimiento: string | undefined): number | string {
  if (!fechaNacimiento) return '-';
  const birthDate = new Date(fechaNacimiento);
  if (isNaN(birthDate.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : '-';
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function DetallePacientePage({ params }: { params: Promise<{ id: string }> }) {
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const pacienteId = Number(resolvedParams.id);

  const [isEditing, setIsEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => getPacienteById(pacienteId),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
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

  useEffect(() => {
    if (data?.data) {
      const p = data.data;
      reset({
        nombres: p.nombres,
        apellidos: p.apellidos,
        cedula: p.cedula,
        fechaNacimiento: p.fechaNacimiento,
        sexo: p.sexo,
        telefono: p.telefono || '',
        correo: p.correo || '',
        direccion: p.direccion || '',
        tipoSangre: p.tipoSangre || '',
        alergias: p.alergias || '',
        contactoEmergencia: p.contactoEmergencia || '',
        telefonoEmergencia: p.telefonoEmergencia || '',
      });
    }
  }, [data, reset, isEditing]);

  const mutation = useMutation({
    mutationFn: (updateData: PacienteFormValues) => updatePaciente(pacienteId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['paciente', pacienteId] });
      setIsEditing(false);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      setServerError(err?.response?.data?.message || 'Error al actualizar el paciente');
    }
  });

  const onSubmit = (formData: PacienteFormValues) => {
    setServerError(null);
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['ADMIN_CLINICA', 'MEDICO', 'RECEPCIONISTA']}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-medium text-foreground">Cargando paciente...</h2>
        </div>
      </RoleGuard>
    );
  }

  if (isError || !data?.data) {
    const err = error as { response?: { status?: number, data?: { message?: string } } };
    const isNotFound = err?.response?.status === 404;
    return (
      <RoleGuard allowedRoles={['ADMIN_CLINICA', 'MEDICO', 'RECEPCIONISTA']}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isNotFound ? 'Paciente no encontrado' : 'Error al cargar'}
          </h2>
          <p className="text-foreground/70 mb-8">
            {isNotFound
              ? 'El paciente que intentas buscar no existe o no tienes permisos para verlo.'
              : (err?.response?.data?.message || 'Ocurrió un error inesperado al cargar los datos.')}
          </p>
          <div className="flex gap-4">
            <Link
              href="/dashboard/pacientes"
              className="px-6 py-2.5 rounded-xl font-medium border border-border hover:bg-surface/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Volver al directorio
            </Link>
            {!isNotFound && (
              <button
                onClick={() => refetch()}
                className="px-6 py-2.5 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <RefreshCcw className="w-4 h-4" />
                Reintentar
              </button>
            )}
          </div>
        </div>
      </RoleGuard>
    );
  }

  const p = data.data;

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA', 'MEDICO', 'RECEPCIONISTA']}>
      <div className="max-w-4xl mx-auto pb-10 space-y-6">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard/pacientes" className="inline-flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2 py-1 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a pacientes
            </Link>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                <UserSquare2 className="w-8 h-8 text-primary" />
                {p.nombres} {p.apellidos}
              </h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border w-fit ${p.activo ? 'bg-success/10 text-success border-success/20' : 'bg-foreground/10 text-foreground/70 border-border'}`}>
                {p.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-foreground/60 text-sm mt-1">
              Registrado el {formatDate(p.createdAt)}
            </p>
          </div>

          {!isEditing && (
            <button type="button" onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 rounded-xl font-medium bg-surface border border-border hover:bg-surface/70 shadow-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Edit className="w-4 h-4" />
              Editar Información
            </button>
          )}
        </header>

        {!isEditing ? (
          <div className="space-y-6 animate-fade-in">
            {/* Ficha View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <section className="glass rounded-2xl p-6 md:p-8 border border-border">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-3 mb-5 flex items-center gap-2">
                  <UserSquare2 className="w-5 h-5 text-primary" />
                  Información Personal
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground/60">Identificación</p>
                    <p className="text-base text-foreground font-medium">{p.cedula}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground/60 flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Fecha de Nac.</p>
                      <p className="text-base text-foreground">{formatDate(p.fechaNacimiento)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/60">Edad</p>
                      <p className="text-base text-foreground">{calcularEdad(p.fechaNacimiento)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60">Sexo</p>
                    <p className="text-base text-foreground capitalize">{p.sexo.toLowerCase()}</p>
                  </div>
                </div>
              </section>

              <section className="glass rounded-2xl p-6 md:p-8 border border-border">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-3 mb-5 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Información de Contacto
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground/60 flex items-center gap-1.5"><Phone className="w-4 h-4"/> Teléfono</p>
                    <p className="text-base text-foreground">{p.telefono || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 flex items-center gap-1.5"><Mail className="w-4 h-4"/> Correo</p>
                    <p className="text-base text-foreground truncate">{p.correo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 flex items-center gap-1.5"><MapPin className="w-4 h-4"/> Dirección</p>
                    <p className="text-base text-foreground">{p.direccion || '-'}</p>
                  </div>
                </div>
              </section>

              <section className="glass rounded-2xl p-6 md:p-8 border border-border md:col-span-2">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-3 mb-5 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-error/80" />
                  Datos Médicos y Emergencias
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-foreground/60">Tipo de Sangre</p>
                      <p className="text-base text-foreground font-semibold">{p.tipoSangre || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/60">Alergias</p>
                      <p className="text-base text-foreground">{p.alergias || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-4 p-4 rounded-xl bg-surface/40 border border-border">
                    <p className="text-sm font-semibold text-foreground border-b border-border/50 pb-2 mb-2">En caso de emergencia</p>
                    <div>
                      <p className="text-sm font-medium text-foreground/60">Contacto</p>
                      <p className="text-base text-foreground">{p.contactoEmergencia || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/60">Teléfono</p>
                      <p className="text-base text-foreground">{p.telefonoEmergencia || '-'}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Preparado estructuralmente para futuras pestañas o módulos (Historia clínica, citas) */}
            <section className="mt-8 border border-border/50 rounded-2xl p-8 bg-surface/30 opacity-70 cursor-not-allowed">
              <div className="text-center space-y-2">
                <Activity className="w-8 h-8 text-foreground/40 mx-auto" />
                <h3 className="text-lg font-medium text-foreground/60">Historia Clínica y Consultas</h3>
                <p className="text-sm text-foreground/50">El módulo clínico completo estará disponible en futuras actualizaciones.</p>
              </div>
            </section>

          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
            <section className="glass rounded-2xl p-6 md:p-8 border border-border">
              {serverError && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Error al guardar</p>
                    <p className="text-sm mt-1 opacity-90">{serverError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h2 className="text-lg font-semibold text-foreground">Editar Información Personal</h2>
                    <button type="button" onClick={() => setIsEditing(false)} className="text-foreground/60 hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
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
                  <label htmlFor="Cédula" className="block text-sm font-medium text-foreground/80">
                    Cédula / Identificación <span className="text-error">*</span>
                  </label>
                  <input
                    id="Cédula"
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
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full md:w-auto px-6 py-2.5 rounded-xl font-medium border border-border hover:bg-surface/70 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || mutation.isPending || !isDirty}
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
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </section>
          </form>
        )}
      </div>
    </RoleGuard>
  );
}











