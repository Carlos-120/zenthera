'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Activity, Building, Settings, Home, Menu, X } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const usuario = useAuthStore((state) => state.usuario);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/v1/auth/logout');
    },
    onSuccess: () => {
      // Limpiar caché de TanStack Query para evitar datos cruzados
      queryClient.clear();
      clearAuth();
      router.push('/login');
    },
    onError: () => {
      // Forzamos la limpieza incluso si falla el endpoint
      queryClient.clear();
      clearAuth();
      router.push('/login');
    }
  });

  if (!usuario) return null;

  // Menú dinámico según el rol
  const menuItems = [
    { label: 'Inicio', path: '/dashboard', icon: <Home className="w-5 h-5" />, roles: ['SUPER_ADMIN', 'ADMIN_CLINICA'] },
    { label: 'Gestión de Clínicas', path: '/dashboard/clinicas', icon: <Building className="w-5 h-5" />, roles: ['SUPER_ADMIN'] },
    { label: 'Mi Clínica', path: '/dashboard/mi-clinica', icon: <Settings className="w-5 h-5" />, roles: ['ADMIN_CLINICA'] },
    // Futuros menús:
    // { label: 'Usuarios', path: '/dashboard/usuarios', icon: <Users className="w-5 h-5" />, roles: ['ADMIN_CLINICA'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(usuario.rol));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-border hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2 mb-4">
          <Activity className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">ZENTHERA</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.path
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground/70 hover:bg-surface hover:text-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-surface/50">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{usuario.nombres}</span>
              <span className="text-xs text-foreground/60 truncate capitalize">{usuario.rol.replace('ROLE_', '').toLowerCase()}</span>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors disabled:opacity-50"
          >
            {logoutMutation.isPending ? (
               <div className="w-4 h-4 border-2 border-error/30 border-t-error rounded-full animate-spin"></div>
            ) : (
               <LogOut className="w-4 h-4" />
            )}
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden glass sticky top-0 z-40 w-full px-4 py-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">ZENTHERA</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => logoutMutation.mutate()} className="text-error p-1">
              <LogOut className="w-5 h-5" />
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass border-b border-border animate-fade-in absolute top-[73px] left-0 w-full z-30 flex flex-col p-4 space-y-2 bg-background/95 backdrop-blur-md">
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.path
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/70 hover:bg-surface hover:text-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <div className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
