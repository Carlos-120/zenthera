'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export function ForcePasswordChangeGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && usuario?.cambiarPassword) {
      if (pathname !== '/cambiar-password') {
        router.push('/cambiar-password');
      }
    }
  }, [isAuthenticated, usuario, pathname, router]);



  // Si requiere cambio de password y no está en la página de cambio, no renderizar los hijos (evitar flash)
  if (isAuthenticated && usuario?.cambiarPassword && pathname !== '/cambiar-password') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
