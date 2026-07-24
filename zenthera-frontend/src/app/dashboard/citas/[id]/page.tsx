'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CitaUpdateRequestSchema, CitaUpdateFormValues, EstadoCitaRequestSchema, EstadoCitaFormValues } from '@/lib/validations/citas.schema';
import { getCitaById, updateCita, updateEstadoCita, EstadoCita } from '@/lib/api/citas';
import { getPacientes } from '@/lib/api/pacientes';
import { getMedicos } from '@/lib/api/medicos';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Edit, AlertCircle, Save, Loader2, CalendarClock, Clock, User, UserCheck, XCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function CitaDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();

  const isAdminClinica = usuario?.rol === 'ADMIN_CLINICA';
  const isRecepcionista = usuario?.rol === 'RECEPCIONISTA';
  const isMedico = usuario?.rol === 'MEDICO';

  const [isEditMode, setIsEditMode] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // State change modal
  const [showStateModal, setShowStateModal] = useState(false);
  const [stateError, setStateError] = useState<string | null>(null);
  const stateTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const stateSelectRef = useRef<HTMLSelectElement | null>(null);

  const { data: citaData, isLoading, isError, error } = useQuery({
    queryKey: ['citas', id],
    queryFn: () => getCitaById(id),
    enabled: !!id,
  });

  const { data: pacientesData } = useQuery({
    queryKey: ['pacientes-options'],
    queryFn: () => getPacientes({ page: 0, size: 50, activo: true }),
    enabled: isEditMode && !isMedico
  });

  const { data: medicosData } = useQuery({
    queryKey: ['medicos-options'],
    queryFn: () => getMedicos({ page: 0, size: 50, activo: true }),
    enabled: isEditMode && !isMedico
  });

  const cita = citaData?.data;

  // Form for Edit
  const editForm = useForm<CitaUpdateFormValues>({
    resolver: zodResolver(CitaUpdateRequestSchema),
  });

  // Populate edit form when edit mode is entered
  useEffect(() => {
    if (isEditMode && cita) {
      // Localize UTC string to YYYY-MM-DDThh:mm format for datetime-local
      const date = new Date(cita.fechaHoraInicio);
      const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

      editForm.reset({
        pacienteId: cita.paciente.id,
        medicoId: cita.medico.id,
        fechaHoraInicio: localIso,
        duracionMinutos: cita.duracionMinutos,
        motivo: cita.motivo,
        observaciones: cita.observaciones || '',
      });
    }
  }, [isEditMode, cita, editForm]);

  // Form for State Change Modal
  const stateForm = useForm<EstadoCitaFormValues>({
    resolver: zodResolver(EstadoCitaRequestSchema),
    defaultValues: {
      motivoCancelacion: '',
    }
  });

  const watchEstado = stateForm.watch('estado');

  const updateMutation = useMutation({
    mutationFn: (data: CitaUpdateFormValues) => updateCita(id, {
      ...data,
      fechaHoraInicio: new Date(data.fechaHoraInicio).toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      setIsEditMode(false);
      setServerError(null);
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.message || 'Error al actualizar la cita.');
    }
  });

  const stateMutation = useMutation({
    mutationFn: (data: EstadoCitaFormValues) => updateEstadoCita(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      handleCloseStateModal();
    },
    onError: (err: any) => {
      setStateError(err.response?.data?.message || 'Error al cambiar el estado.');
    }
  });

  const onEditSubmit = (data: CitaUpdateFormValues) => {
    setServerError(null);
    updateMutation.mutate(data);
  };

  const onStateSubmit = (data: EstadoCitaFormValues) => {
    setStateError(null);
    stateMutation.mutate(data);
  };

  const handleOpenStateModal = (target: HTMLButtonElement) => {
    stateTriggerRef.current = target;
    setShowStateModal(true);
    stateForm.reset({ estado: cita?.estado as EstadoCita, motivoCancelacion: '' });
    setStateError(null);
  };

  const handleCloseStateModal = () => {
    setShowStateModal(false);
    setStateError(null);
    stateForm.reset({ motivoCancelacion: '' });
    if (stateTriggerRef.current) {
      stateTriggerRef.current.focus();
    }
  };

  // Auto-focus the select when modal opens
  useEffect(() => {
    if (showStateModal && stateSelectRef.current) {
      stateSelectRef.current.focus();
    }
  }, [showStateModal]);

  const isFinalState = (estado: EstadoCita | undefined) =>
    estado === 'COMPLETADA' || estado === 'CANCELADA' || estado === 'NO_ASISTIO';

  const canEdit = !isFinalState(cita?.estado) && cita?.estado !== 'EN_ATENCION';

  // Role based transition logic
  const getValidNextStates = (currentState: EstadoCita | undefined) => {
    let options: EstadoCita[] = [];
    if (currentState === 'PROGRAMADA') {
      options = ['CONFIRMADA', 'EN_ATENCION', 'CANCELADA', 'NO_ASISTIO'];
    } else if (currentState === 'CONFIRMADA') {
      options = ['EN_ATENCION', 'CANCELADA', 'NO_ASISTIO'];
    } else if (currentState === 'EN_ATENCION') {
      options = ['COMPLETADA'];
    }

    if (isRecepcionista) {
      options = options.filter(s => s === 'CONFIRMADA' || s === 'CANCELADA' || s === 'NO_ASISTIO');
    }
    if (isMedico) {
      options = options.filter(s => s === 'EN_ATENCION' || s === 'COMPLETADA' || s === 'NO_ASISTIO');
    }
    return options;
  };

  const nextStates = getValidNextStates(cita?.estado);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isError || !cita) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Error al cargar la cita</h2>
        <p className="text-foreground/60 mt-2">{error instanceof Error ? error.message : 'Cita no encontrada.'}</p>
        <Link href="/dashboard/citas" className="mt-6 inline-block bg-surface px-6 py-2 rounded-xl text-foreground font-medium border border-border">
          Volver
        </Link>
      </div>
    );
  }

  const formatFechaLocal = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <RoleGuard allowedRoles={['ADMIN_CLINICA', 'RECEPCIONISTA', 'MEDICO']}>
      <div className="max-w-5xl mx-auto pb-10 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard/citas" className="inline-flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2 py-1 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a citas
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <CalendarClock className="w-8 h-8 text-primary" />
              Detalle de Cita
            </h1>
          </div>
          <div className="flex gap-3">
            {!isFinalState(cita.estado) && nextStates.length > 0 && (
              <button
                onClick={(e) => handleOpenStateModal(e.currentTarget)}
                className="bg-surface hover:bg-surface/70 text-foreground border border-border font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Cambiar Estado
              </button>
            )}
            {!isEditMode && canEdit && (
              <button
                onClick={() => setIsEditMode(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar Cita
              </button>
            )}
          </div>
        </header>

        {isEditMode ? (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-8 animate-fade-in">
            <section className="glass rounded-2xl p-6 md:p-8 border border-border">
              {serverError && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3 mb-6" role="alert">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Error al guardar</p>
                    <p className="text-sm mt-1 opacity-90">{serverError}</p>
                  </div>
                </div>
              )}

              {cita.estado === 'CONFIRMADA' && !isMedico && (
                <div className="p-4 mb-6 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 text-sm">
                  <strong>Atención:</strong> Al editar (reprogramar) una cita CONFIRMADA, su estado volverá automáticamente a PROGRAMADA y requerirá una nueva confirmación.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Paciente */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="pacienteId" className="block text-sm font-medium text-foreground/80">
                    Paciente <span className="text-error">*</span>
                  </label>
                  <select
                    id="pacienteId"
                    className="w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60"
                    {...editForm.register('pacienteId', { valueAsNumber: true })}
                    disabled={isMedico} // Medico cannot reprogram patients
                  >
                    <option value={cita.paciente.id}>{cita.paciente.nombres} {cita.paciente.apellidos}</option>
                    {!isMedico && pacientesData?.data?.content?.map(p => (
                      <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
                    ))}
                  </select>
                  {editForm.formState.errors.pacienteId && <p className="text-xs text-error mt-1.5">{editForm.formState.errors.pacienteId.message}</p>}
                </div>

                {/* Médico */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="medicoId" className="block text-sm font-medium text-foreground/80">
                    Médico <span className="text-error">*</span>
                  </label>
                  <select
                    id="medicoId"
                    className="w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60"
                    {...editForm.register('medicoId', { valueAsNumber: true })}
                    disabled={isMedico} // Medico cannot reprogram doctors
                  >
                    <option value={cita.medico.id}>{cita.medico.nombres} {cita.medico.apellidos}</option>
                    {!isMedico && medicosData?.data?.content?.map(m => (
                      <option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>
                    ))}
                  </select>
                  {editForm.formState.errors.medicoId && <p className="text-xs text-error mt-1.5">{editForm.formState.errors.medicoId.message}</p>}
                </div>

                {/* Fecha y Hora */}
                <div className="space-y-1.5">
                  <label htmlFor="fechaHoraInicio" className="block text-sm font-medium text-foreground/80">
                    Fecha y Hora <span className="text-error">*</span>
                  </label>
                  <input
                    id="fechaHoraInicio"
                    type="datetime-local"
                    className="w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60"
                    {...editForm.register('fechaHoraInicio')}
                    disabled={isMedico} // Medico cannot reprogram dates
                  />
                  {editForm.formState.errors.fechaHoraInicio && <p className="text-xs text-error mt-1.5">{editForm.formState.errors.fechaHoraInicio.message}</p>}
                </div>

                {/* Duración */}
                <div className="space-y-1.5">
                  <label htmlFor="duracionMinutos" className="block text-sm font-medium text-foreground/80">
                    Duración (minutos) <span className="text-error">*</span>
                  </label>
                  <input
                    id="duracionMinutos"
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    className="w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60"
                    {...editForm.register('duracionMinutos', { valueAsNumber: true })}
                    disabled={isMedico}
                  />
                  {editForm.formState.errors.duracionMinutos && <p className="text-xs text-error mt-1.5">{editForm.formState.errors.duracionMinutos.message}</p>}
                </div>

                {/* Motivo */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="motivo" className="block text-sm font-medium text-foreground/80">
                    Motivo de Consulta <span className="text-error">*</span>
                  </label>
                  <input
                    id="motivo"
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60"
                    {...editForm.register('motivo')}
                    disabled={isMedico}
                  />
                  {editForm.formState.errors.motivo && <p className="text-xs text-error mt-1.5">{editForm.formState.errors.motivo.message}</p>}
                </div>

                {/* Observaciones */}
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="observaciones" className="block text-sm font-medium text-foreground/80">
                    Observaciones Clínicas
                  </label>
                  <textarea
                    id="observaciones"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border bg-surface/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60"
                    placeholder="Instrucciones o notas médicas..."
                    {...editForm.register('observaciones')}
                    disabled={isRecepcionista} // Recepcionista no edita observaciones
                  />
                  {editForm.formState.errors.observaciones && <p className="text-xs text-error mt-1.5">{editForm.formState.errors.observaciones.message}</p>}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-border flex flex-col-reverse md:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="w-full md:w-auto px-6 py-2.5 rounded-xl font-medium border border-border hover:bg-surface/70 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Guardar Cambios
                </button>
              </div>
            </section>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
              <section className="glass rounded-2xl p-6 md:p-8 border border-border">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Información de la Cita</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface border border-border shadow-sm">
                    {cita.estado}
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-foreground/50 font-medium mb-1 flex items-center gap-1.5"><CalendarClock className="w-4 h-4"/> Motivo</p>
                    <p className="text-foreground font-medium text-lg">{cita.motivo}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface/50 p-4 rounded-xl border border-border">
                      <p className="text-sm text-foreground/50 font-medium mb-1 flex items-center gap-1.5"><Clock className="w-4 h-4"/> Inicio programado</p>
                      <p className="text-foreground font-medium">{formatFechaLocal(cita.fechaHoraInicio)}</p>
                    </div>
                    <div className="bg-surface/50 p-4 rounded-xl border border-border">
                      <p className="text-sm text-foreground/50 font-medium mb-1 flex items-center gap-1.5"><Clock className="w-4 h-4"/> Fin programado</p>
                      <p className="text-foreground font-medium">{formatFechaLocal(cita.fechaHoraFin)}</p>
                      <p className="text-xs text-foreground/50 mt-0.5">Duración: {cita.duracionMinutos} min</p>
                    </div>
                  </div>

                  {cita.observaciones && (
                    <div className="pt-2">
                      <p className="text-sm text-foreground/50 font-medium mb-1">Observaciones Clínicas</p>
                      <div className="bg-surface/30 p-4 rounded-xl border border-border text-foreground/90 whitespace-pre-wrap">
                        {cita.observaciones}
                      </div>
                    </div>
                  )}

                  {cita.estado === 'CANCELADA' && cita.motivoCancelacion && (
                    <div className="pt-2">
                      <p className="text-sm text-error/80 font-medium mb-1">Motivo de Cancelación</p>
                      <div className="bg-error/10 text-error p-4 rounded-xl border border-error/20 whitespace-pre-wrap">
                        {cita.motivoCancelacion}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <section className="glass rounded-2xl p-6 border border-border">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2 mb-4 flex items-center gap-1.5">
                  <User className="w-4 h-4"/> Paciente
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 font-bold text-sm">
                    {cita.paciente.nombres.charAt(0)}{cita.paciente.apellidos.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{cita.paciente.nombres} {cita.paciente.apellidos}</p>
                    <Link href={`/dashboard/pacientes/${cita.paciente.id}`} className="text-xs text-primary hover:underline">Ver perfil</Link>
                  </div>
                </div>
              </section>

              <section className="glass rounded-2xl p-6 border border-border">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2 mb-4 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4"/> Médico
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20 shrink-0 font-bold text-sm">
                    {cita.medico.nombres.charAt(0)}{cita.medico.apellidos.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{cita.medico.nombres} {cita.medico.apellidos}</p>
                  </div>
                </div>
              </section>

              <section className="glass rounded-2xl p-6 border border-border">
                <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">Auditoría</h3>
                <div className="space-y-2 text-sm text-foreground/70">
                  <p>Creado: <br/><span className="text-foreground">{formatFechaLocal(cita.createdAt)}</span></p>
                  <p>Actualizado: <br/><span className="text-foreground">{formatFechaLocal(cita.updatedAt)}</span></p>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* State Change Modal */}
      {showStateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCloseStateModal();
          }}
        >
          <div
            className="bg-surface border border-border shadow-2xl rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-state-title"
          >
            <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
              <h2 id="modal-state-title" className="text-xl font-bold text-foreground">Cambiar Estado</h2>
              <button onClick={handleCloseStateModal} className="p-1 text-foreground/50 hover:text-foreground focus:outline-none" aria-label="Cerrar">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={stateForm.handleSubmit(onStateSubmit)} className="flex-1 overflow-y-auto">

              {stateError && (
                <div className="p-3 mb-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-start gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{stateError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="nuevoEstado" className="block text-sm font-medium text-foreground/80">Nuevo Estado <span className="text-error">*</span></label>
                  <div className="relative">
                    <select
                      id="nuevoEstado"
                      className="w-full px-4 py-2.5 rounded-xl border bg-surface text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary border-border"
                      {...(() => {
                        const { ref, ...rest } = stateForm.register('estado');
                        return {
                          ...rest,
                          ref: (el: HTMLSelectElement | null) => {
                            ref(el);
                            stateSelectRef.current = el;
                          },
                        };
                      })()}
                    >
                      <option value="" disabled>Seleccionar estado...</option>
                      {nextStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-foreground/50 pointer-events-none" />
                  </div>
                  {stateForm.formState.errors.estado && <p className="text-xs text-error mt-1">{stateForm.formState.errors.estado.message}</p>}
                </div>

                {watchEstado === 'CANCELADA' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label htmlFor="motivoCancelacion" className="block text-sm font-medium text-foreground/80">Motivo de Cancelación <span className="text-error">*</span></label>
                    <textarea
                      id="motivoCancelacion"
                      rows={3}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-surface focus:outline-none focus:ring-2 focus:ring-primary ${
                        stateForm.formState.errors.motivoCancelacion ? 'border-error' : 'border-border'
                      }`}
                      placeholder="Explique el motivo..."
                      {...stateForm.register('motivoCancelacion')}
                    />
                    {stateForm.formState.errors.motivoCancelacion && <p className="text-xs text-error mt-1">{stateForm.formState.errors.motivoCancelacion.message}</p>}
                  </div>
                )}
              </div>

              <div className="pt-5 mt-5 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseStateModal}
                  className="px-4 py-2 rounded-xl font-medium border border-border hover:bg-surface/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={stateMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={stateMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-xl shadow-lg transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                >
                  {stateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
