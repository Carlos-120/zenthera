'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUsuariosMedicosDisponibles, 
  linkMedicoUsuario, 
  unlinkMedicoUsuario,
  crearCuentaAccesoMedico,
  restablecerPasswordMedico,
  MedicoResponse
} from '@/lib/api/medicos';
import { Shield, ShieldAlert, Link as LinkIcon, Unlink, CheckCircle2, UserPlus, Clock, Key, X, Eye, EyeOff } from 'lucide-react';

interface MedicoCuentaAccessProps {
  medico: MedicoResponse;
}

export function MedicoCuentaAccess({ medico }: MedicoCuentaAccessProps) {
  const queryClient = useQueryClient();
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | ''>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'reset'>('crear');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modalError, setModalError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios-medicos-disponibles'],
    queryFn: getUsuariosMedicosDisponibles,
    enabled: !medico.usuarioId // Only fetch if not currently linked
  });

  const linkMutation = useMutation({
    mutationFn: (usuarioId: number) => linkMedicoUsuario(medico.id, usuarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medico', medico.id] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-medicos-disponibles'] });
      setActionMessage({ type: 'success', text: 'Cuenta vinculada correctamente.' });
      setTimeout(() => setActionMessage(null), 3000);
    },
    onError: () => {
      setActionMessage({ type: 'error', text: 'Error al vincular la cuenta.' });
      setTimeout(() => setActionMessage(null), 3000);
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: () => unlinkMedicoUsuario(medico.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medico', medico.id] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-medicos-disponibles'] });
      setActionMessage({ type: 'success', text: 'Cuenta desvinculada correctamente.' });
      setTimeout(() => setActionMessage(null), 3000);
    },
    onError: () => {
      setActionMessage({ type: 'error', text: 'Error al desvincular la cuenta.' });
      setTimeout(() => setActionMessage(null), 3000);
    }
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: { password: string; confirmPassword: string }) => crearCuentaAccesoMedico(medico.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medico', medico.id] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-medicos-disponibles'] });
      closeModal();
      setActionMessage({ type: 'success', text: 'Cuenta de acceso creada y vinculada correctamente.' });
      setTimeout(() => setActionMessage(null), 3000);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Error al crear la cuenta de acceso.';
      setModalError(errorMessage);
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { password: string; confirmPassword: string }) => restablecerPasswordMedico(medico.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medico', medico.id] });
      closeModal();
      setActionMessage({ type: 'success', text: 'Contraseña restablecida correctamente. El usuario deberá cambiarla.' });
      setTimeout(() => setActionMessage(null), 5000);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Error al restablecer la contraseña.';
      setModalError(errorMessage);
    }
  });

  const handleLink = () => {
    if (selectedUsuarioId) {
      linkMutation.mutate(Number(selectedUsuarioId));
    }
  };

  const handleUnlink = () => {
    if (confirm('¿Estás seguro de que deseas desvincular la cuenta de acceso de este médico?')) {
      unlinkMutation.mutate();
    }
  };

  const openModal = (mode: 'crear' | 'reset') => {
    setModalMode(mode);
    setIsModalOpen(true);
    setPassword('');
    setConfirmPassword('');
    setModalError('');
    setShowPassword(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const submitModal = () => {
    if (password.length < 12) {
      setModalError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setModalError('Las contraseñas no coinciden.');
      return;
    }
    
    setModalError('');
    if (modalMode === 'crear') {
      createAccountMutation.mutate({ password, confirmPassword });
    } else {
      resetPasswordMutation.mutate({ password, confirmPassword });
    }
  };

  const usuariosDisponibles = data?.data || [];

  return (
    <div className="glass rounded-2xl p-6 border border-border">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Cuenta de Acceso</h2>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
          actionMessage.type === 'success' 
            ? 'bg-success/10 border border-success/20 text-success' 
            : 'bg-error/10 border border-error/20 text-error'
        }`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{actionMessage.text}</p>
        </div>
      )}

      {medico.estadoCuenta === 'ACTIVA' && (
        <div className="space-y-6">
          <div className="bg-success/5 border border-success/20 rounded-xl p-5">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-success">🟢 Activa</h3>
                <p className="text-foreground/80 mt-1">{medico.correoUsuario}</p>
                <p className="text-foreground/60 text-sm mt-1">Rol: Médico</p>
                <div className="mt-4">
                  <p className="text-sm font-medium text-success/80">
                    El profesional puede iniciar sesión en Zenthera.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => openModal('reset')}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-warning text-warning font-semibold hover:bg-warning/10 transition-colors"
            >
              <Key className="w-5 h-5" />
              Restablecer Contraseña
            </button>
            <button
              onClick={handleUnlink}
              disabled={unlinkMutation.isPending}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-error text-error font-semibold hover:bg-error/10 transition-colors disabled:opacity-50"
            >
              <Unlink className="w-5 h-5" />
              {unlinkMutation.isPending ? 'Desvinculando...' : 'Desvincular Cuenta'}
            </button>
          </div>
        </div>
      )}

      {medico.estadoCuenta === 'CAMBIO_PASSWORD_REQUERIDO' && (
        <div className="space-y-6">
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-5">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-warning">🟠 Cambio de contraseña pendiente</h3>
                <p className="text-foreground/80 mt-1">{medico.correoUsuario}</p>
                <p className="text-foreground/60 text-sm mt-1">Rol: Médico</p>
                <div className="mt-4">
                  <p className="text-sm font-medium text-warning/80">
                    El profesional debe iniciar sesión con su contraseña temporal y establecer una nueva.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => openModal('reset')}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-warning text-warning font-semibold hover:bg-warning/10 transition-colors"
            >
              <Key className="w-5 h-5" />
              Restablecer Contraseña
            </button>
            <button
              onClick={handleUnlink}
              disabled={unlinkMutation.isPending}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-error text-error font-semibold hover:bg-error/10 transition-colors disabled:opacity-50"
            >
              <Unlink className="w-5 h-5" />
              {unlinkMutation.isPending ? 'Desvinculando...' : 'Desvincular Cuenta'}
            </button>
          </div>
        </div>
      )}

      {medico.estadoCuenta === 'INACTIVA' && (
        <div className="space-y-6">
          <div className="bg-error/5 border border-error/20 rounded-xl p-5">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-6 h-6 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-error">🔴 Cuenta inactiva</h3>
                <p className="text-foreground/80 mt-1">{medico.correoUsuario}</p>
                <p className="text-foreground/60 text-sm mt-1">Rol: Médico</p>
                <div className="mt-4">
                  <p className="text-sm font-medium text-error/80">
                    El acceso de este profesional está deshabilitado.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleUnlink}
            disabled={unlinkMutation.isPending}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-error text-error font-semibold hover:bg-error/10 transition-colors disabled:opacity-50"
          >
            <Unlink className="w-5 h-5" />
            {unlinkMutation.isPending ? 'Desvinculando...' : 'Desvincular Cuenta'}
          </button>
        </div>
      )}

      {(!medico.estadoCuenta || medico.estadoCuenta === 'SIN_CUENTA') && (
        <div className="space-y-6">
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-5">
            <div className="flex gap-4">
              <ShieldAlert className="w-6 h-6 text-warning flex-shrink-0" />
              <div>
                <h3 className="font-bold text-warning">Sin cuenta de acceso</h3>
                <p className="text-warning/80 text-sm mt-1">
                  Este médico todavía no puede iniciar sesión ni registrar atención clínica.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => openModal('crear')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    <UserPlus className="w-5 h-5" />
                    Crear cuenta de acceso
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-foreground/40 font-medium">o</span>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider">
              Vincular Usuario Existente
            </h4>
            
            {isLoading ? (
              <div className="h-12 bg-surface/50 animate-pulse rounded-xl" />
            ) : usuariosDisponibles.length === 0 ? (
              <p className="text-sm text-foreground/60 italic">
                No hay usuarios con rol MÉDICO disponibles para vincular. 
                Debe crear un usuario primero desde la sección de Usuarios.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <select
                  value={selectedUsuarioId}
                  onChange={(e) => setSelectedUsuarioId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full sm:flex-1 px-4 py-2.5 bg-surface/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none transition-all"
                >
                  <option value="">Selecciona un usuario...</option>
                  {usuariosDisponibles.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombres} {u.apellidos} ({u.correo} - {u.cedula})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLink}
                  disabled={!selectedUsuarioId || linkMutation.isPending}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-surface/50 border-2 border-border text-foreground font-semibold rounded-xl hover:bg-surface/80 hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="w-5 h-5" />
                  {linkMutation.isPending ? 'Vinculando...' : 'Vincular'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {modalMode === 'crear' ? (
                  <><UserPlus className="w-5 h-5 text-primary" /> Crear Cuenta de Acceso</>
                ) : (
                  <><Key className="w-5 h-5 text-warning" /> Restablecer Contraseña</>
                )}
              </h3>
              <button onClick={closeModal} className="text-foreground/50 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error rounded-xl text-sm">
                {modalError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Contraseña temporal</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Mínimo 12 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Confirmar contraseña temporal</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Debe coincidir"
                />
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-foreground/70 hover:bg-surface/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitModal}
                  disabled={createAccountMutation.isPending || resetPasswordMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {(createAccountMutation.isPending || resetPasswordMutation.isPending) 
                    ? 'Procesando...' 
                    : modalMode === 'crear' ? 'Crear Cuenta' : 'Restablecer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
