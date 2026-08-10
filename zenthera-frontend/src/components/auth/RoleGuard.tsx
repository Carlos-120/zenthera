'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const usuario = useAuthStore((state) => state.usuario);
  const router = useRouter();

  const isAuthorized = usuario ? allowedRoles.includes(usuario.rol) : false;

  useEffect(() => {
    if (usuario) {
      if (usuario.cambiarPassword) {
        router.replace('/cambiar-password');
        return;
      }
      if (!isAuthorized) {
        // Simular un UX de acceso denegado redirigiendo o mostrando error.
        // Aquí optamos por redirigir al dashboard principal.
        router.replace('/dashboard');
      }
    }
  }, [usuario, isAuthorized, router]);

  if (!isAuthorized) {
    return null; // O un componente de "Cargando / Acceso Denegado"
  }

  return <>{children}</>;
}
