'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/axios';
import { LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

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
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-background">
      {/* Elementos decorativos (Glassmorphism blobs) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="z-10 w-full max-w-md p-8 animate-fade-in glass rounded-2xl mx-4">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">ZENTHERA</h1>
          <p className="text-sm text-foreground/60 mt-2">Plataforma de Gestión Médica</p>
        </div>

        {loginMutation.isError && (
          <div role="alert" className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 flex items-center text-error text-sm">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
            <p>Credenciales incorrectas o acceso denegado.</p>
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
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loginMutation.isPending}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 text-foreground"
              placeholder="••••••••"
            />
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
      </div>
    </div>
  );
}
