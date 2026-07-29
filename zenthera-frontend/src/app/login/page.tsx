'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/axios';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { PublicFormCard } from '@/components/public/PublicFormCard';
import { PublicLayout } from '@/components/public/PublicLayout';
import { PublicSecurityNotice } from '@/components/public/PublicSecurityNotice';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const registered = searchParams.get('registered') === '1';

  const loginMutation = useMutation({
    mutationFn: async () => {
      // 1. Iniciar sesión y obtener token
      const response = await apiClient.post('/api/v1/auth/login', {
        correo,
        password,
      });
      const accessToken = response.data.data.accessToken;

      // 2. Obtener el perfil del usuario utilizando el token recién adquirido
      const meResponse = await apiClient.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const usuario = meResponse.data.data;
      return { accessToken, usuario };
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.usuario);
      router.push('/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <PublicLayout>
      <div className="py-2 sm:py-4">
      <PublicFormCard className="animate-fade-in">
        <div className="mb-9 text-left">
          <p className="text-sm font-semibold text-accent">Acceso seguro</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Bienvenido de nuevo</h1>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">Inicia sesión para acceder al panel de tu clínica.</p>
        </div>

        {loginMutation.isError && (
          <div role="alert" className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 flex items-center text-error text-sm">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
            <p>Credenciales incorrectas o acceso denegado.</p>
          </div>
        )}

        {registered && (
          <div role="status" className="mb-6 rounded-lg border border-success/20 bg-success/10 p-4 text-sm text-success">
            Clínica registrada correctamente. Revisa tu correo para activar la cuenta del administrador.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-foreground/80 mb-1">
              Correo Electrónico
            </label>
            <input
              id="correo"
              name="correo"
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              disabled={loginMutation.isPending}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loginMutation.isPending}
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-border bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground"
                placeholder="••••••••"
              />
              <button
                type="button"
                disabled={loginMutation.isPending}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/55 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3 px-4 flex items-center justify-center rounded-xl font-medium text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
          >
            {loginMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/65">
          ¿Aún no tienes una clínica?{' '}
          <Link href="/registro" className="font-medium text-primary hover:text-primary-hover hover:underline">
            Regístrala aquí
          </Link>
        </p>
      </PublicFormCard>
      <PublicSecurityNotice />
      </div>
    </PublicLayout>
  );
}
