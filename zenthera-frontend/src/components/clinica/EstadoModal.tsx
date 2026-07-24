import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';
import { ClinicaResponse } from '@/lib/api/clinicas';

interface EstadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinica: ClinicaResponse | null;
  onConfirm: (motivo: string) => void;
  isPending: boolean;
  externalError?: string | null;
}

export function EstadoModal({ isOpen, onClose, clinica, onConfirm, isPending, externalError }: EstadoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [localError, setLocalError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management y cleanup
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      const timeoutId = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timeoutId);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Cierre con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);



  if (!isOpen || !clinica) return null;

  const isActiva = clinica.activa;
  const targetState = !isActiva;

  const displayError = localError || externalError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setLocalError('Debe proporcionar un motivo para este cambio de estado.');
      return;
    }
    setLocalError('');
    onConfirm(motivo);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-background w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${targetState ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
              {targetState ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <h2 id="modal-title" className="text-xl font-bold">
              {targetState ? 'Reactivar Clínica' : 'Suspender Clínica'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Cerrar modal"
            className="p-2 hover:bg-surface rounded-lg transition-colors text-foreground/50 hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">

            {externalError && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error flex items-start gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{externalError}</p>
              </div>
            )}

            <p className="text-foreground/80">
              ¿Está seguro que desea <strong className={targetState ? 'text-success' : 'text-error'}>{targetState ? 'reactivar' : 'suspender'}</strong> la clínica <strong>{clinica.nombre}</strong> (RUC: {clinica.ruc})?
            </p>

            {!targetState && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Al suspender la clínica, todos los usuarios asociados perderán el acceso al sistema inmediatamente.</p>
              </div>
            )}

            <div>
              <label htmlFor="motivo" className="block text-sm font-medium text-foreground/90 mb-1">
                Motivo del Cambio de Estado *
              </label>
              <textarea
                id="motivo"
                ref={textareaRef}
                rows={3}
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  if (localError) setLocalError('');
                }}
                disabled={isPending}
                placeholder="Escriba el motivo detallado de esta acción..."
                className={`w-full bg-surface border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none ${displayError ? 'border-error' : 'border-border'}`}
              />
              {localError && <p className="mt-1 text-sm text-error">{localError}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-surface/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl font-medium hover:bg-surface border border-border transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50 ${
                targetState
                  ? 'bg-success hover:bg-success/90 text-white'
                  : 'bg-error hover:bg-error/90 text-white'
              }`}
            >
              {isPending && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              {targetState ? 'Confirmar Reactivación' : 'Confirmar Suspensión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
