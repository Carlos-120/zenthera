'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { activateAccount } from '@/lib/api/auth';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

export default function ActivationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialToken] = useState<string | null>(() => searchParams.get('token'));

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(() =>
    initialToken ? null : 'Enlace de activación inválido o faltante'
  );
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialToken && typeof window !== 'undefined') {
      // Remove token from URL immediately for security
      const url = new URL(window.location.href);
      if (url.searchParams.has('token')) {
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [initialToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialToken) {
      setError('El token de activación es inválido o ha expirado');
      return;
    }

    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await activateAccount(initialToken, password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      if (err.response?.status === 429) {
        setError('Demasiados intentos. Por favor intente más tarde.');
      } else if (err.response?.status === 503) {
        const retryAfter = err.response.headers['retry-after'] || '5';
        setError(`El servicio está ocupado. Por favor, intente de nuevo en ${retryAfter} segundos.`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Ocurrió un error inesperado al activar la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in text-center">
        <CheckCircle className="w-16 h-16 text-[var(--success)]" />
        <h2 className="text-2xl font-bold text-[var(--foreground)]">¡Cuenta Activada!</h2>
        <p className="text-gray-500">Su cuenta ha sido activada exitosamente. Redirigiendo al inicio de sesión...</p>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Activar Cuenta</h1>
        <p className="text-gray-500">Configure su contraseña para comenzar a usar Zenthera</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--error)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Nueva Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all text-[var(--foreground)]"
              placeholder="Mínimo 12 caracteres"
              required
              minLength={12}
              autoComplete="new-password"
              disabled={loading || !initialToken}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all text-[var(--foreground)]"
              placeholder="Mínimo 12 caracteres"
              required
              minLength={12}
              autoComplete="new-password"
              disabled={loading || !initialToken}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Ocultar confirmar contraseña" : "Mostrar confirmar contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !initialToken}
          className="w-full py-3 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Activando...</span>
            </>
          ) : (
            <span>Activar Cuenta</span>
          )}
        </button>
      </form>
    </div>
  );
}
