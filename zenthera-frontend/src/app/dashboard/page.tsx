'use client';

import { useAuthStore } from '@/store/authStore';
import { User, ShieldCheck, Building } from 'lucide-react';

export default function DashboardPage() {
  const usuario = useAuthStore((state) => state.usuario);

  if (!usuario) {
    return null; // El AuthProvider manejará la redirección
  }

  return (
    <>
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Bienvenido, <span className="text-primary">{usuario.nombres}</span>
        </h1>
        <p className="text-foreground/60 text-lg">
          Panel de control principal de la clínica
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Perfil */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary border border-primary/20">
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-semibold mb-1">{usuario.nombres} {usuario.apellidos}</h2>
          <p className="text-sm text-foreground/60 mb-4">{usuario.correo}</p>

          <div className="w-full flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-border mt-auto">
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <ShieldCheck className="w-4 h-4 text-success" />
              Rol asignado
            </div>
            <span className="text-sm font-semibold capitalize bg-primary/10 text-primary px-2 py-1 rounded-md">
              {usuario.rol.replace('ROLE_', '').toLowerCase()}
            </span>
          </div>
        </div>

        {/* Información de Clínica */}
        <div className="glass rounded-2xl p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-500/20">
              <Building className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold">Contexto Tenant</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-surface/50 border border-border rounded-xl">
              <p className="text-sm text-foreground/60 mb-1">Clínica Asociada</p>
              <p className="text-xl font-bold text-foreground">{usuario.clinicaNombre}</p>
            </div>

            <div className="p-4 bg-surface/50 border border-border rounded-xl">
              <p className="text-sm text-foreground/60 mb-1">Estado de Sesión</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></div>
                <p className="text-sm font-medium text-success">Activa y Segura (Refresh Token en Cookie)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
