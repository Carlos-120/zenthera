/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, Save } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const CambiarPasswordSchema = z.object({
  newPassword: z.string().min(12, 'La contraseña debe tener entre 12 y 72 caracteres').max(72, 'La contraseña debe tener entre 12 y 72 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

type CambiarPasswordValues = z.infer<typeof CambiarPasswordSchema>;

export default function CambiarPasswordPage() {
  const router = useRouter();
  const { usuario } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<CambiarPasswordValues>({
    resolver: zodResolver(CambiarPasswordSchema)
  });

  const onSubmit = async (data: CambiarPasswordValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await api.post('/api/v1/auth/cambiar-password', {
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });

      // Update auth store user state so changing password is no longer true
      if (usuario) {
        useAuthStore.setState({ usuario: { ...usuario, cambiarPassword: false } });
      }

      // Redirect to dashboard (if user has right permissions, dashboard guards will handle it)
      router.push('/dashboard');
    } catch (error: any) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach((err: string) => {
          const [field, ...messageParts] = err.split(': ');
          const message = messageParts.join(': ');
          if (field && message) {
            setError(field as keyof CambiarPasswordValues, { type: 'server', message });
          }
        });
        setServerError('Revisa los campos marcados.');
      } else if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Ocurrió un error inesperado. Por favor, intente de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Cambiar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Mínimo 12 caracteres"
              />
              {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Repite la nueva contraseña"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar y Continuar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
