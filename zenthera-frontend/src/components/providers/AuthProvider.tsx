'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/axios';

const PUBLIC_ROUTES = ['/login', '/activate', '/registro'];
const GUEST_ONLY_ROUTES = ['/login'];

let initPromise: Promise<void> | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setAuth = useAuthStore((state) => state.setAuth);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          // Intenta recuperar sesión silenciosamente
          const resRefresh = await apiClient.post('/api/v1/auth/refresh');
          const token = resRefresh.data.data.accessToken;

          // Extraemos perfil
          const resMe = await apiClient.get('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const user = resMe.data.data;

          setAuth(token, user);
        } catch {
          // Falló o no hay sesión. Limpiar estado por seguridad.
          clearAuth();
        }
      })();
    }

    initPromise.finally(() => {
      setIsInitializing(false);
      initPromise = null;
    });
  }, [setAuth, clearAuth]);

  useEffect(() => {
    if (!isInitializing) {
      if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
        router.push('/login');
      } else if (isAuthenticated && GUEST_ONLY_ROUTES.includes(pathname)) {
        router.push('/dashboard');
      }
    }
  }, [isInitializing, isAuthenticated, pathname, router]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prevenir parpadeos si se redirige
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
