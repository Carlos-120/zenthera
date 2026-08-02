'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Activity, Building, Settings, Home, Menu, X, Users, Calendar, FileText, Stethoscope, Search, Bell, ChevronRight } from 'lucide-react';
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

  // Derive breadcrumbs based on pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const isLast = index === pathSegments.length - 1;
    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { title, isLast };
  });

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

  // Menú dinámico según el rol y diseño
  const menuItems = [
    { label: 'Panel de Control', path: '/dashboard', icon: <Home className="w-5 h-5" />, roles: ['SUPER_ADMIN', 'ADMIN_CLINICA'] },
    { label: 'Pacientes', path: '/dashboard/pacientes', icon: <Users className="w-5 h-5" />, roles: ['ADMIN_CLINICA'] },
    { label: 'Agenda de Citas', path: '/dashboard/citas', icon: <Calendar className="w-5 h-5" />, roles: ['ADMIN_CLINICA'] },
    { label: 'Historias Clínicas', path: '#', icon: <FileText className="w-5 h-5" />, roles: ['ADMIN_CLINICA'], disabled: true },
    { label: 'Consultas', path: '#', icon: <Stethoscope className="w-5 h-5" />, roles: ['ADMIN_CLINICA'], disabled: true },
    { label: 'Configuración', path: '/dashboard/mi-clinica', icon: <Settings className="w-5 h-5" />, roles: ['ADMIN_CLINICA'] },
    { label: 'Usuarios y Roles', path: '/dashboard/usuarios', icon: <Users className="w-5 h-5" />, roles: ['ADMIN_CLINICA'] },
    { label: 'Gestión de Clínicas', path: '/dashboard/clinicas', icon: <Building className="w-5 h-5" />, roles: ['SUPER_ADMIN'] },
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

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            item.disabled ? (
              <div
                key={item.label}
                title="Próximamente"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/40 cursor-not-allowed select-none"
              >
                {item.icon}
                {item.label}
              </div>
            ) : (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/70 hover:bg-surface hover:text-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
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
              item.disabled ? (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/40 cursor-not-allowed"
                >
                  {item.icon}
                  {item.label}
                </div>
              ) : (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/70 hover:bg-surface hover:text-foreground'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            ))}
          </div>
        )}

        {/* Desktop Topbar */}
        <header className="hidden md:flex h-16 glass sticky top-0 z-30 w-full px-8 items-center justify-between border-b border-border">
          <div className="flex items-center text-sm text-foreground/60">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
                <span className={crumb.isLast ? 'font-medium text-foreground' : ''}>
                  {crumb.title}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-6">
            {/* Buscador Visual */}
            <div className="relative hidden lg:block text-foreground/50 focus-within:text-foreground/80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar pacientes, citas..."
                className="pl-9 pr-4 py-2 w-64 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors"
                disabled
              />
            </div>

            {/* Notificaciones */}
            <button className="relative text-foreground/60 hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
            </button>

            {/* Perfil Header */}
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium leading-none">{usuario.nombres}</span>
                {usuario.clinicaNombre && (
                  <span className="text-xs text-foreground/60 mt-1">{usuario.clinicaNombre}</span>
                )}
              </div>
              <div className="w-9 h-9 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-full">
                {usuario.nombres.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 w-full max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
